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

// This is the core logic of your agent
async function runMcpAgent(problemDescription: string, userEmail: string): Promise<string | { error: string, details?: any }> {
  try {
    const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN // <-- For Supabase MCP

    let errorMessage = ''
    if (!githubToken)
      errorMessage += 'GITHUB_PERSONAL_ACCESS_TOKEN is not set. '
    if (!anthropicApiKey)
      errorMessage += 'ANTHROPIC_API_KEY is not set. '
    if (!supabaseAccessToken)
      errorMessage += 'SUPABASE_ACCESS_TOKEN is not set. ' // <-- Check for Supabase token

    if (errorMessage) {
      console.error('Server configuration errors:', errorMessage)
      return { error: `Server configuration error: ${errorMessage.trim()}` }
    }

    const supabaseProjectRef = 'vcisedfdaufqkvyvkfcy' // Define your project ref here

    const config: AppConfig = {
      mcpServers: {
        github: {
          command: 'docker',
          args: [
            'run',
            '-i', // Keep -i for interactive mode if the server expects stdin
            '--rm', // Automatically remove the container when it exits
            '-e',
            'GITHUB_PERSONAL_ACCESS_TOKEN', // Docker will take this from the env passed by MCPClient
            '-e',
            'GITHUB_TOOLSETS', // Docker will take this from the env passed by MCPClient
            'ghcr.io/github/github-mcp-server',
          ],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: githubToken,
            GITHUB_TOOLSETS: 'issues', // <--- MODIFIED: Only issues toolset
          },
        },
        supabase: { // <-- New Supabase MCP server configuration
          command: 'npx', // Recommended way to run the official Supabase MCP server
          args: [
            '-y',
            '@supabase/mcp-server-supabase@latest',
            '--access-token',
            supabaseAccessToken!,
            '--project-ref',
            supabaseProjectRef,
          ],
        },
      },
    }

    const client = MCPClient.fromDict(config)

    const llm = new ChatAnthropic({
      model: 'claude-3-7-sonnet-latest',
      temperature: 0.1,
    })

    const agent = new MCPAgent({ llm, client, maxSteps: 500 })

    const comprehensiveQuery = `
      Regarding the user with email "${userEmail}", the problem is: "${problemDescription}".
      Do not run execute any update edge functions as we are only examining the data.
      1. Connect to the Supabase project osaainbwkuzzqvvwklal and look at the products, user_cart_items, and users tables.
      2. In the 'users' table, find the record where the 'email' column matches and retrieve the complete user object or relevant details for this user.
      3. Once you have the user's information, report the issue.
      Let me know the user's details you found.
    `
    const result = await agent.run(comprehensiveQuery) // Use the comprehensive query
    return result
  }
  catch (error: any) {
    console.error('Error running MCP agent:', error)
    return { error: 'Agent execution failed.', details: error.message || String(error) }
  }
}

// Define the event handler for the /api/submit endpoint
export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    event.node.res.statusCode = 405
    return { error: 'Method Not Allowed. Please use POST.' }
  }

  const body = await readBody(event)
  const userEmail = body.email as string | undefined
  const problemDescription = body.problemDescription as string | undefined

  const agentResult = await runMcpAgent(problemDescription!, userEmail!)

  return { success: true, result: agentResult }
})
