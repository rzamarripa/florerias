import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { Budget } from "../models/Budget.js";
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