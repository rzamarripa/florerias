import mongoose from "mongoose";
import { openai } from '@ai-sdk/openai';
import { generateObject, streamText } from 'ai';
import { z } from 'zod';
import { Budget } from "../models/Budget.js";
import { Company } from "../models/Company.js";
import { Branch } from "../models/Branch.js";
import { Brand } from "../models/Brand.js";
import { RsCompanyBrand } from "../models/CompanyBrands.js";

const getModel = (name) => {
  try {
    return mongoose.model(name);
  } catch (error) {
    console.warn(`Model ${name} not found:`, error.message);
    return null;
  }
};

const querySchema = z.object({
  query: z.string().describe('Complete MongoDB query string (e.g., db.cc_budget.find({}) or db.cc_budget.aggregate([...]))'),
  collection: z.string().describe('Collection name being queried (e.g., cc_budget, cc_companies)'),
  operation: z.enum(['find', 'aggregate', 'countDocuments', 'distinct']).describe('MongoDB operation type'),
  explanation: z.string().describe('Brief explanation of what the query does in Spanish')
});

const BUDGET_SCHEMA_CONTEXT = `
You are an expert MongoDB query generator for CAPREPA - a comprehensive business management system. You have access to the following collections and their schemas:

## Available Collections:

### cc_budget (Presupuestos):
{
  routeId: ObjectId (ref: "cc_route", optional),
  brandId: ObjectId (ref: "cc_brand", required),
  companyId: ObjectId (ref: "cc_companies", required), 
  branchId: ObjectId (ref: "cc_branch", required),
  categoryId: ObjectId (ref: "cc_category", required),
  assignedAmount: Number (min: 0, required),
  month: String (format: "YYYY-MM", required),
  createdAt: Date,
  updatedAt: Date
}

### TERMINOLOGÍA IMPORTANTE PARA USUARIOS:
- "categoría" = "unidad de negocio" (en la interfaz de usuario)
- "company" = "razón social" (en la interfaz de usuario)
- "branch" = "sucursal"
- "brand" = "marca"

### cc_companies (Empresas):
{
  name: String (required),
  legalRepresentative: String (required),
  rfc: String (required),
  address: String (required),
  isActive: Boolean (default: true),
  createdAt: Date
}

### cc_branch (Sucursales):
{
  companyId: ObjectId (ref: "cc_companies", required),
  name: String (required),
  countryId: ObjectId (ref: "cc_country", required),
  stateId: ObjectId (ref: "cc_state", required),
  municipalityId: ObjectId (ref: "cc_municipality", required),
  address: String (required),
  phone: String (required),
  email: String (required),
  description: String,
  isActive: Boolean (default: true),
  createdAt: Date
}

### cc_brand (Marcas):
{
  logo: { data: Buffer, contentType: String },
  categoryId: ObjectId (ref: "cc_category"),
  name: String (required),
  description: String,
  isActive: Boolean (default: true),
  createdAt: Date
}

### cc_category (Categorías):
{
  name: String (required),
  description: String,
  hasRoutes: Boolean (default: false),
  isActive: Boolean (default: true),
  createdAt: Date
}

### cc_route (Rutas):
{
  name: String (required),
  branchId: ObjectId (ref: "cc_branch", required),
  companyId: ObjectId (ref: "cc_companies", required),
  brandId: ObjectId (ref: "cc_brand", required),
  isActive: Boolean (default: true),
  createdAt: Date
}

### rs_company_brand (Relación Empresa-Marca):
{
  brandId: ObjectId (ref: "cc_brand", required),
  companyId: ObjectId (ref: "cc_companies", required),
  createdAt: Date
}

### rs_branch_brand (Relación Sucursal-Marca):
{
  branchId: ObjectId (ref: "cc_branch", required),
  brandId: ObjectId (ref: "cc_brand", required),
  createdAt: Date
}

## Available Query Operations (READ ONLY):
- find()
- findOne()
- aggregate()
- countDocuments()
- distinct()

## Query Rules:
1. ONLY generate READ operations (find, aggregate, countDocuments, distinct)
2. Use proper MongoDB ObjectId format for references
3. Always validate month format as "YYYY-MM" for budget queries
4. Use aggregation with $lookup for joins between collections
5. Return valid MongoDB query syntax only
6. No write operations (insert, update, delete) allowed
7. ALWAYS respond to the user in SPANISH, as CAPREPA application is in Spanish
8. Focus on providing business insights about budgets, companies, branches, brands, categories and routes
9. When joining data, use $lookup stages to get related information
10. In $lookup operations, use the exact collection names as specified in the schema
11. In $project stages, ALWAYS include calculated fields from previous stages (like totalBudget from $group)
12. Use proper $arrayElemAt syntax: first get the document, then access properties

## IMPORTANT MONTH FILTERING:
- CURRENT_MONTH = "${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}"
- When users ask for "presupuestos", "presupuesto actual", "este mes", always filter by month: "${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}"
- If no specific month is mentioned, use current month by default for budget queries
- Users can specify different months like "enero 2024" (2024-01), "mes pasado", etc.
- For "presupuestos por categoría" always include month filter unless user specifically asks for all months

### Key Rules:
- ALWAYS include calculated fields (like totalBudget) in $project
- Use $arrayElemAt: ["$arrayName", 0] to get first element, then access properties separately
- Use $addFields to extract nested properties after $lookup

Generate ONLY the MongoDB query object or aggregation pipeline based on the user's question about CAPREPA business data.
`;

function validateReadOnlyQuery(queryStr) {
  const writeOperations = [
    'insert', 'update', 'delete', 'remove', 'replace', 'drop', 
    'create', 'modify', 'save', 'upsert', '$set', '$unset', 
    '$push', '$pull', '$inc', '$dec'
  ];
  
  const lowerQuery = queryStr.toLowerCase();
  for (const op of writeOperations) {
    if (lowerQuery.includes(op)) {
      throw new Error(`Write operation "${op}" not allowed. Only read operations are permitted.`);
    }
  }
  
  if (!lowerQuery.includes('find') && !lowerQuery.includes('aggregate') && 
      !lowerQuery.includes('count') && !lowerQuery.includes('distinct')) {
    throw new Error('Query must use valid read operations: find, aggregate, countDocuments, or distinct');
  }
  
  return true;
}

async function executeMongoQuery(queryStr) {
  try {
    validateReadOnlyQuery(queryStr);
    
    const collectionMap = {
      'cc_budget': Budget,
      'cc_companies': Company,
      'cc_branch': Branch,
      'cc_brand': Brand,
      'rs_company_brand': RsCompanyBrand,
      'cc_category': getModel('cc_category'),
      'cc_route': getModel('cc_route'),
      'rs_branch_brand': getModel('rs_branch_brand'),
      'cc_country': getModel('cc_country'),
      'cc_state': getModel('cc_state'),
      'cc_municipality': getModel('cc_municipality')
    };
    
    let targetCollection = Budget;
    let cleanQuery = queryStr;
    
    for (const [collectionName, model] of Object.entries(collectionMap)) {
      if (queryStr.includes(`db.${collectionName}.`) && model) {
        targetCollection = model;
        cleanQuery = queryStr.replace(new RegExp(`^db\\.${collectionName}\\.`), '').replace(/;?$/, '');
        break;
      }
    }
    
    if (!targetCollection) {
      throw new Error('Collection not available or not supported');
    }
    
    let result;
    if (cleanQuery.startsWith('find(')) {
      const match = cleanQuery.match(/find\((.*?)\)(?:\.populate\((.*?)\))?(?:\.limit\((\d+)\))?(?:\.sort\((.*?)\))?/);
      if (match) {
        const [, filterStr, populateStr, limitStr, sortStr] = match;
        const filter = filterStr ? JSON.parse(filterStr || '{}') : {};
        
        let query = targetCollection.find(filter);
        
        if (populateStr) {
          const populateFields = populateStr.replace(/['"]/g, '').split(',').map(f => f.trim());
          populateFields.forEach(field => {
            const commonFields = ['routeId', 'brandId', 'companyId', 'branchId', 'categoryId', 
                                'countryId', 'stateId', 'municipalityId'];
            if (commonFields.includes(field)) {
              query = query.populate(field);
            }
          });
        }
        
        if (limitStr) query = query.limit(parseInt(limitStr));
        if (sortStr) query = query.sort(JSON.parse(sortStr));
        
        result = await query;
      }
    } else if (cleanQuery.startsWith('aggregate(')) {
      const pipelineMatch = cleanQuery.match(/aggregate\(\s*(\[[\s\S]*\])\s*\)/);
      if (pipelineMatch) {
        try {
          const pipelineStr = pipelineMatch[1];
          
          const pipeline = eval('(' + pipelineStr + ')');
          
          result = await targetCollection.aggregate(pipeline);
        } catch (parseError) {
          throw new Error(`Failed to parse aggregation pipeline: ${parseError.message}`);
        }
      }
    } else if (cleanQuery.startsWith('countDocuments(')) {
      const filterMatch = cleanQuery.match(/countDocuments\((.*?)\)/);
      const filter = filterMatch ? JSON.parse(filterMatch[1] || '{}') : {};
      result = await targetCollection.countDocuments(filter);
    } else if (cleanQuery.startsWith('distinct(')) {
      const distinctMatch = cleanQuery.match(/distinct\(['"]([^'"]+)['"](?:,\s*(.*?))?\)/);
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

export const processQuery = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a string"
      });
    }

    const { object: queryData } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: querySchema,
      messages: [
        { role: "system", content: BUDGET_SCHEMA_CONTEXT },
        ...conversationHistory,
        { role: "user", content: `Generate a MongoDB query for: ${message}` }
      ],
      temperature: 0.1,
      maxTokens: 1000,
      maxRetries: 2,
      maxSteps: 7
    });

    let queryResults;
    try {
      queryResults = await executeMongoQuery(queryData.query);
    } catch (queryError) {
      return res.status(400).json({
        success: false,
        message: `Query error: ${queryError.message}`,
        generatedQuery: queryData.query
      });
    }

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        { 
          role: "system", 
          content: `Eres un asistente financiero experto del sistema CAPREPA que ayuda a contadores, gerentes y administradores. 

REGLAS IMPORTANTES:
- NUNCA menciones código MongoDB, consultas, aggregations, o términos técnicos
- Responde como si fueras un consultor financiero explicando datos de negocio
- Usa lenguaje simple y empresarial (presupuestos, empresas, sucursales, etc.)
- Si no hay datos, explica de manera positiva qué se puede hacer
- Enfócate en insights útiles para toma de decisiones
- SIEMPRE responde en ESPAÑOL con un tono profesional pero accesible
- Si encuentras un problema en los datos, explícalo en términos de negocio
- Recuerda que "categoría" = "unidad de negocio" y "company" = "razón social"

Ejemplo de respuesta correcta: "He revisado los presupuestos y encontré que la empresa tiene un total de $50,000 asignados este mes"
Ejemplo INCORRECTO: "La consulta aggregate devolvió undefined porque no hay documentos que coincidan"` 
        },
        { 
          role: "user", 
          content: `Un usuario del sistema CAPREPA preguntó: "${message}"\n\nDatos encontrados: ${JSON.stringify(queryResults, null, 2)}\n\nPor favor explica estos resultados como un consultor financiero en lenguaje de negocio claro y útil.` 
        }
      ],
      temperature: 0.3,
      maxTokens: 1500,
      maxSteps: 1,
      maxRetries: 2
    });

    const chunks = [];
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
    }
    const naturalResponse = chunks.join('');
    
    const finalResponse = { 
      query: queryData.query,
      results: queryResults,
      response: naturalResponse || "No pude generar una respuesta natural.",
      resultCount: Array.isArray(queryResults) ? queryResults.length : typeof queryResults === 'number' ? 1 : 0,
      explanation: queryData.explanation
    };
    
    res.json({
      success: true,
      data: finalResponse
    });

  } catch (error) {
    console.error('❌ [CHAT ERROR]:', error);
    res.status(500).json({
      success: false,
      message: "Failed to process query",
      error: error.message
    });
  }
};

export const streamChatQuery = async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "Messages array is required"
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return res.status(400).json({
        success: false,
        message: "Last message must be from user"
      });
    }

    const { object: queryData } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: querySchema,
      messages: [
        { role: "system", content: BUDGET_SCHEMA_CONTEXT },
        ...messages.slice(0, -1),
        { role: "user", content: `Generate a MongoDB query for: ${lastMessage.content}` }
      ],
      temperature: 0.1,
      maxTokens: 1000,
      maxRetries: 2
    });

    let queryResults;
    try {
      queryResults = await executeMongoQuery(queryData.query);
    } catch (queryError) {
      queryResults = { error: queryError.message };
    }

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        { 
          role: "system", 
          content: `Eres un asistente financiero experto del sistema CAPREPA. 

REGLAS IMPORTANTES:
- NUNCA menciones código MongoDB, consultas, aggregations, o términos técnicos
- Responde como si fueras un consultor financiero explicando datos de negocio
- Usa lenguaje simple y empresarial (presupuestos, empresas, sucursales, etc.)
- Si no hay datos, explica de manera positiva qué se puede hacer
- Enfócate en insights útiles para toma de decisiones
- SIEMPRE responde en ESPAÑOL con un tono profesional pero accesible
- Recuerda que "categoría" = "unidad de negocio" y "company" = "razón social"

Los datos encontrados: ${JSON.stringify(queryResults, null, 2)}` 
        },
        ...messages
      ],
      temperature: 0.3,
      maxTokens: 1500,
      maxSteps: 1,
      maxRetries: 2
    });

    const response = result.toDataStreamResponse();
    
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    const reader = response.body?.getReader();
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    
    res.end();

  } catch (error) {
    console.error('❌ [STREAMING CHAT ERROR]:', error);
    res.status(500).json({
      success: false,
      message: "Failed to process streaming query",
      error: error.message
    });
  }
};

export const getChatContext = async (req, res) => {
  try {
    let exampleQueries = [
      "¿Cuál es el presupuesto total de este mes?",
      "¿Qué empresa tiene mayor presupuesto asignado?",
      "Muéstrame los presupuestos por categoría",
      "¿Cuánto se ha asignado en total este año?",
      "¿Qué sucursal tiene menor presupuesto?"
    ];

    try {
      const availableData = await Budget.aggregate([
        {
          $group: {
            _id: null,
            totalBudgets: { $sum: 1 },
            monthsAvailable: { $addToSet: "$month" },
            totalAmount: { $sum: "$assignedAmount" }
          }
        }
      ]);

      const contextInfo = availableData[0];
      if (contextInfo && contextInfo.totalBudgets > 0) {
        const aiPrompt = `Genera 5 preguntas ejemplo prácticas para un sistema de gestión empresarial CAPREPA.

Datos disponibles:
- ${contextInfo.totalBudgets} presupuestos registrados
- Meses: ${contextInfo.monthsAvailable.join(', ')}
- Total: $${contextInfo.totalAmount.toLocaleString()}

Genera preguntas útiles para:
- Contadores
- Gerentes 
- Administradores
- Personal de finanzas

Requisitos:
1. Preguntas en ESPAÑOL
2. Enfoque en análisis financiero y presupuestario
3. Usar meses reales: ${contextInfo.monthsAvailable.slice(0, 3).join(', ')}
4. Prácticas para toma de decisiones empresariales
5. Sin términos técnicos de bases de datos

Devuelve JSON array de strings.`;

        const exampleResult = await streamText({
          model: openai('gpt-4o-mini'),
          messages: [
            { role: "system", content: "Eres un experto en finanzas empresariales que genera preguntas útiles para usuarios de sistemas de gestión. Responde en español con JSON válido." },
            { role: "user", content: aiPrompt }
          ],
          temperature: 0.7,
          maxTokens: 400,
          maxSteps: 1
        });

        const chunks = [];
        for await (const chunk of exampleResult.textStream) {
          chunks.push(chunk);
        }
        const aiResponse = chunks.join('').trim();
        if (aiResponse) {
          try {
            const parsedExamples = JSON.parse(aiResponse);
            if (Array.isArray(parsedExamples) && parsedExamples.length > 0) {
              exampleQueries = parsedExamples;
            }
          } catch (parseError) {
            console.warn('Failed to parse AI examples, using defaults');
          }
        }
      }
    } catch (dataError) {
      console.warn('Failed to get data for examples, using defaults:', dataError.message);
    }

    const context = {
      exampleQueries
    };

    res.json({
      success: true,
      data: context
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get chat context",
      error: error.message
    });
  }
}; 