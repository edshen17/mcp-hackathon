import process from 'node:process'
import { ChatAnthropic } from '@langchain/anthropic'
import { MCPAgent, MCPClient } from 'mcp-use' // Assuming mcp-use is your chosen library
import 'dotenv/config' // Ensure environment variables are loaded

// Define your interfaces (as before)
interface McpServerConfig {
  command: string
  args: string[]
  env?: Record<string, string | undefined>
}

interface AppConfig {
  mcpServers: Record<string, McpServerConfig>
}

// This is the core logic of your agent, refactored to be callable
// and to accept the query as a parameter.
async function runMcpAgent(query: string, email: string): Promise<string | { error: string, details?: any }> {
  try {
    const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    if (!githubToken) {
      console.error('GITHUB_PERSONAL_ACCESS_TOKEN is not set.')
      return { error: 'Server configuration error: Missing GitHub token.' }
    }
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY is not set.')
      return { error: 'Server configuration error: Missing Anthropic API key.' }
    }

    const config: AppConfig = {
      mcpServers: {
        github: {
          command: 'docker',
          args: [
            'run',
            '-i',
            '--rm',
            '-e',
            'GITHUB_PERSONAL_ACCESS_TOKEN',
            '-e',
            'GITHUB_TOOLSETS',
            'ghcr.io/github/github-mcp-server',
          ],
          env: { // This ensures the MCP server process gets the token
            GITHUB_PERSONAL_ACCESS_TOKEN: githubToken,
            GITHUB_TOOLSETS: 'repos,issues,pull_requests,code_security,experiments',
          },
        },
      },
    }

    const client = MCPClient.fromDict(config) // Or your MCPClient initialization

    const llm = new ChatAnthropic({
      model: 'claude-3-opus-20240229', // Or your preferred Claude model
      // apiKey: anthropicApiKey, // Usually picked from env, but can be explicit
      temperature: 0.7,
    })

    const agent = new MCPAgent({ llm, client, maxSteps: 30 })

    console.warn(`Running agent for email: ${email} with query: "${query}"`)
    const result = await agent.run(query)
    console.warn(`Agent result: ${result}`)
    return result
  }
  catch (error: any) {
    console.error('Error running MCP agent:', error)
    // Be careful about exposing raw error details to the client
    return { error: 'Agent execution failed.', details: error.message || String(error) }
  }
}

// Define the event handler for the /api/submit endpoint
export default defineEventHandler(async (event) => {
  // Determine the request method (e.g., POST)
  if (event.node.req.method !== 'POST') {
    event.node.res.statusCode = 405 // Method Not Allowed
    return { error: 'Method Not Allowed. Please use POST.' }
  }

  // Get the query from the request body
  const body = await readBody(event)
  const userEmail = body.email
  const problemDescription = body.problemDescription

  if (!userEmail || typeof userEmail !== 'string') {
    event.node.res.statusCode = 400 // Bad Request
    return { error: 'Missing or invalid "email" in request body.' }
  }

  if (!problemDescription || typeof problemDescription !== 'string') {
    event.node.res.statusCode = 400 // Bad Request
    return { error: 'Missing or invalid "problemDescription" in request body.' }
  }

  // Run the agent
  const agentResult = await runMcpAgent(problemDescription, userEmail)
  if (typeof agentResult === 'string') {
    return { success: true, result: agentResult }
  }
  else {
    // If agentResult is an error object
    event.node.res.statusCode = 500 // Internal Server Error
    return { success: false, ...agentResult }
  }
})
