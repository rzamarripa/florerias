import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import {
  evaluateQuery,
  generateDirectResponse,
  executeComplexQuery,
  generateResponseFromResults
} from "../services/chatService.js";

export const processQuery = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a string"
      });
    }

    console.log(`🌟 NEW QUERY: "${message}"`);

    const evaluation = await evaluateQuery(message, conversationHistory);
    
    if (!evaluation.requiresDatabase) { 
      console.log(`💬 DIRECT response path`);
      const directResponse = await generateDirectResponse(message, conversationHistory);
      
      const chunks = [];
      for await (const chunk of directResponse.textStream) {
        chunks.push(chunk);
      }
      const responseText = chunks.join('');

      return res.json({
        success: true,
        data: {
          type: 'direct',
          response: responseText,
          evaluation: evaluation,
          requiresDatabase: false
        }
      });
    }

    const queryExecution = await executeComplexQuery(message, conversationHistory);
    
    if (!queryExecution.success) {
      return res.status(400).json({
        success: false,
        message: queryExecution.error,
        generatedQuery: queryExecution.generatedQuery,
        step: queryExecution.step
      });
    }

    const naturalResponse = await generateResponseFromResults(
      message, 
      queryExecution, 
      conversationHistory
    );

    const chunks = [];
    for await (const chunk of naturalResponse.textStream) {
      chunks.push(chunk);
    }
    const responseText = chunks.join('');
    
    const finalResponse = {
      type: 'database',
      response: responseText || "No pude generar una respuesta natural.",
      evaluation: evaluation,
      requiresDatabase: true,
      execution: {
        totalSteps: queryExecution.totalSteps,
        steps: queryExecution.steps.map(step => ({
          step: step.step,
          explanation: step.explanation,
          resultCount: step.resultCount
        })),
        finalResults: queryExecution.finalResults
      }
    };
    
    res.json({
      success: true,
      data: finalResponse
    });

  } catch (error) {
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

    const conversationHistory = messages.slice(0, -1);
    
    const evaluation = await evaluateQuery(lastMessage.content, conversationHistory);
    
    let result;
    
    if (!evaluation.requiresDatabase) {
      result = await generateDirectResponse(lastMessage.content, conversationHistory);
    } else {
      const queryExecution = await executeComplexQuery(lastMessage.content, conversationHistory);
      
      if (!queryExecution.success) {
        return res.status(400).json({
          success: false,
          message: queryExecution.error,
          generatedQuery: queryExecution.generatedQuery
        });
      }

      result = await generateResponseFromResults(
        lastMessage.content,
        queryExecution,
        conversationHistory
      );
    }

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
      "¿Cómo gestionar roles de usuario?",
      "¿Qué páginas están disponibles en el sistema?",
      "¿Cómo asignar permisos a usuarios?",
      "¿Qué usuarios tienen acceso administrativo?",
      "¿Cómo configurar la visibilidad de módulos?"
    ];

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