import mongoose from "mongoose";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText } from "ai";
import { User } from "../models/User.js";
import { Role } from "../models/Roles.js";
import { Page } from "../models/Page.js";
import { RoleVisibility } from "../models/RoleVisibility.js";
import { Module } from "../models/Module.js";
import {
  EVALUATION_PROMPT,
  GENERAL_ASSISTANT_PROMPT,
  DATABASE_SCHEMA_CONTEXT,
  QUERY_RESULT_INTERPRETER_PROMPT,
} from "../config/chatPrompts.js";
import { queryEvaluationSchema, querySchema } from "../config/chatSchemas.js";

const MAX_QUERY_STEPS = 3;

const getModel = (name) => {
  try {
    return mongoose.model(name);
  } catch (error) {
    return null;
  }
};

const collectionMap = {
  cc_users: User,
  cc_roles: Role,
  cc_pages: Page,
  cc_role_visibility: RoleVisibility,
  cc_modules: Module,
};

function validateReadOnlyQuery(queryStr) {
  const writeOperations = [
    "insert",
    "update",
    "delete",
    "remove",
    "replace",
    "drop",
    "create",
    "modify",
    "save",
    "upsert",
    "$set",
    "$unset",
    "$push",
    "$pull",
    "$inc",
    "$dec",
  ];

  const lowerQuery = queryStr.toLowerCase();
  for (const op of writeOperations) {
    if (lowerQuery.includes(op)) {
      throw new Error(
        `Write operation "${op}" not allowed. Only read operations are permitted.`
      );
    }
  }

  if (
    !lowerQuery.includes("find") &&
    !lowerQuery.includes("aggregate") &&
    !lowerQuery.includes("count") &&
    !lowerQuery.includes("distinct")
  ) {
    throw new Error(
      "Query must use valid read operations: find, aggregate, countDocuments, or distinct"
    );
  }

  return true;
}

async function executeMongoQuery(queryStr) {
  try {
    validateReadOnlyQuery(queryStr);

    let targetCollection = User;
    let cleanQuery = queryStr;

    for (const [collectionName, model] of Object.entries(collectionMap)) {
      if (queryStr.includes(`db.${collectionName}.`) && model) {
        targetCollection = model;
        cleanQuery = queryStr
          .replace(new RegExp(`^db\\.${collectionName}\\.`), "")
          .replace(/;?$/, "");
        break;
      }
    }

    if (!targetCollection) {
      throw new Error("Collection not available or not supported");
    }

    let result;
    if (cleanQuery.startsWith("find(")) {
      const match = cleanQuery.match(
        /find\((.*?)\)(?:\.populate\((.*?)\))?(?:\.limit\((\d+)\))?(?:\.sort\((.*?)\))?/
      );
      if (match) {
        const [, filterStr, populateStr, limitStr, sortStr] = match;
        const filter = filterStr ? JSON.parse(filterStr || "{}") : {};

        let query = targetCollection.find(filter);

        if (populateStr) {
          const populateFields = populateStr
            .replace(/['"]/g, "")
            .split(",")
            .map((f) => f.trim());
          populateFields.forEach((field) => {
            const commonFields = ["roleId", "pageId", "moduleId", "userId"];
            if (commonFields.includes(field)) {
              query = query.populate(field);
            }
          });
        }

        if (limitStr) query = query.limit(parseInt(limitStr));
        if (sortStr) query = query.sort(JSON.parse(sortStr));

        result = await query;
      }
    } else if (cleanQuery.startsWith("aggregate(")) {
      const pipelineMatch = cleanQuery.match(
        /aggregate\(\s*(\[[\s\S]*\])\s*\)/
      );
      if (pipelineMatch) {
        try {
          const pipelineStr = pipelineMatch[1];
          const pipeline = eval("(" + pipelineStr + ")");
          result = await targetCollection.aggregate(pipeline);
        } catch (parseError) {
          throw new Error(
            `Failed to parse aggregation pipeline: ${parseError.message}`
          );
        }
      }
    } else if (cleanQuery.startsWith("countDocuments(")) {
      const filterMatch = cleanQuery.match(/countDocuments\((.*?)\)/);
      const filter = filterMatch ? JSON.parse(filterMatch[1] || "{}") : {};
      result = await targetCollection.countDocuments(filter);
    } else if (cleanQuery.startsWith("distinct(")) {
      const distinctMatch = cleanQuery.match(
        /distinct\(['"]([^'"]+)['"](?:,\s*(.*?))?\)/
      );
      if (distinctMatch) {
        const [, field, filterStr] = distinctMatch;
        const filter = filterStr ? JSON.parse(filterStr) : {};
        result = await targetCollection.distinct(field, filter);
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

export async function evaluateQuery(message, conversationHistory = []) {
  try {
    const { object: evaluation } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: queryEvaluationSchema,
      messages: [
        { role: "system", content: EVALUATION_PROMPT },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      temperature: 0.1,
      maxTokens: 200,
      maxRetries: 2,
    });

    return evaluation;
  } catch (error) {
    throw new Error(`Failed to evaluate query: ${error.message}`);
  }
}

export async function generateDirectResponse(
  message,
  conversationHistory = []
) {
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: [
      { role: "system", content: GENERAL_ASSISTANT_PROMPT },
      ...conversationHistory,
      { role: "user", content: message },
    ],
    temperature: 0.3,
    maxTokens: 1500,
    maxRetries: 2,
  });

  return result;
}

export async function executeComplexQuery(message, conversationHistory = []) {
  let allResults = [];
  let currentQuery = message;
  let stepCount = 0;

  while (stepCount < MAX_QUERY_STEPS) {
    stepCount++;

    const contextualMessages = [
      { role: "system", content: DATABASE_SCHEMA_CONTEXT },
      ...conversationHistory,
    ];

    if (allResults.length > 0) {
      const failedQueries = allResults.filter((r) => r.resultCount === 0);

      if (failedQueries.length > 0) {
        contextualMessages.push({
          role: "assistant",
          content: `Previous queries failed - DO NOT REPEAT. Try simpler approach without joins.`,
        });
      }

      const lastResult = allResults[allResults.length - 1];
      if (lastResult && lastResult.results) {
        contextualMessages.push({
          role: "assistant",
          content: `Previous step found: ${JSON.stringify(
            lastResult.results,
            null,
            2
          )}`,
        });
      }
    }

    let queryContext = currentQuery;
    if (stepCount > 1 && allResults.length > 0) {
      const lastResult = allResults[allResults.length - 1];
      if (Array.isArray(lastResult.results) && lastResult.results.length > 0) {
        const firstResult = lastResult.results[0];
        if (firstResult._id) {
          queryContext = `Get name for company with ID: ${firstResult._id}. Use this exact format: db.cc_companies.find({"_id": ObjectId("${firstResult._id}")})`;
        }
      }
    }

    contextualMessages.push({ role: "user", content: queryContext });

    const { object: queryData } = await generateObject({
      model: openai("gpt-4o"),
      schema: querySchema,
      messages: contextualMessages,
      temperature: 0.1,
      maxTokens: 1000,
      maxRetries: 2,
    });

    let queryResults;
    try {
      queryResults = await executeMongoQuery(queryData.query);
    } catch (queryError) {
      return {
        success: false,
        error: `Query error: ${queryError.message}`,
        generatedQuery: queryData.query,
        step: stepCount,
      };
    }

    const stepResult = {
      step: stepCount,
      query: queryData.query,
      explanation: queryData.explanation,
      results: queryResults,
      resultCount: Array.isArray(queryResults)
        ? queryResults.length
        : typeof queryResults === "number"
        ? 1
        : 0,
    };

    allResults.push(stepResult);

    if (!queryData.needsAdditionalQuery) {
      break;
    }

    if (stepCount >= MAX_QUERY_STEPS) {
      break;
    }

    if (
      Array.isArray(queryResults) &&
      queryResults.length === 0 &&
      stepCount > 1
    ) {
      break;
    }

    currentQuery =
      queryData.missingInformation ||
      `Get names for the IDs found in previous step`;
  }

  return {
    success: true,
    steps: allResults,
    totalSteps: stepCount,
    finalResults: allResults[allResults.length - 1]?.results,
    combinedResults: allResults,
  };
}

export async function generateResponseFromResults(
  originalMessage,
  queryExecution,
  conversationHistory = []
) {
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: QUERY_RESULT_INTERPRETER_PROMPT,
      },
      ...conversationHistory,
      {
        role: "user",
        content: `Un usuario del sistema MaFlores preguntó: "${originalMessage}"\n\nDatos encontrados tras ${
          queryExecution.totalSteps
        } consulta(s): ${JSON.stringify(
          queryExecution.combinedResults,
          null,
          2
        )}\n\nPor favor explica estos resultados como un consultor financiero en lenguaje de negocio claro y útil.`,
      },
    ],
    temperature: 0.3,
    maxTokens: 1500,
    maxSteps: 1,
    maxRetries: 2,
  });

  return result;
}
