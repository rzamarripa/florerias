import { z } from 'zod';

export const queryEvaluationSchema = z.object({
  requiresDatabase: z.boolean().describe('Whether the user query requires database access'),
  reasoning: z.string().describe('Brief explanation of why database access is or is not needed')
});

export const querySchema = z.object({
  query: z.string().describe('Complete MongoDB query string (e.g., db.cc_budget.find({}) or db.cc_budget.aggregate([...]))'),
  collection: z.string().describe('Collection name being queried (e.g., cc_budget, cc_companies)'),
  operation: z.enum(['find', 'aggregate', 'countDocuments', 'distinct']).describe('MongoDB operation type'),
  explanation: z.string().describe('Brief explanation of what the query does in Spanish'),
  needsAdditionalQuery: z.boolean().describe('Whether this query needs additional information to be complete (e.g., finding ID by name first)'),
  missingInformation: z.string().optional().describe('What information is missing that requires another query (only if needsAdditionalQuery is true)')
});

 