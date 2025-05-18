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

// Common function to initialize client and LLM, or you can repeat in each function
// For simplicity here, we'll create them as needed.

// --- Function 1: Fetch Supabase Data ---
async function fetchSupabaseUserDetails(
  problemDescription: string,
  userEmail: string,
): Promise<string | { error: string, details?: any }> {
  try {
    const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    let errorMessage = ''
    if (!anthropicApiKey)
      errorMessage += 'ANTHROPIC_API_KEY is not set. '
    if (!supabaseAccessToken)
      errorMessage += 'SUPABASE_ACCESS_TOKEN is not set. '

    if (errorMessage) {
      console.error('Server configuration errors for Supabase step:', errorMessage)
      return { error: `Server configuration error: ${errorMessage.trim()}` }
    }

    const supabaseProjectRef = 'vcisedfdaufqkvyvkfcy' // Define your project ref here

    // Configuration for Supabase MCP server
    const supabaseConfig: AppConfig = {
      mcpServers: {
        supabase: {
          command: 'npx',
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

    const client = MCPClient.fromDict(supabaseConfig)
    const llm = new ChatAnthropic({
      model: 'claude-3-opus-20240229', // Or your preferred model
      temperature: 0.1,
      apiKey: anthropicApiKey,
    })
    const agent = new MCPAgent({ llm, client, maxSteps: 500 }) // Adjust maxSteps as needed

    const supabaseQuery = `
      Regarding the user with email "${userEmail}", the problem is: "${problemDescription}".
      Do not run execute any update edge functions as we are only examining the data.
      1. Connect to the Supabase project osaainbwkuzzqvvwklal and look at the products, user_cart_items, and users tables.
      2. In the 'users' table, find the record where the 'email' column matches and retrieve the complete user object or relevant details for this user.
      3. Once you have the user's information, report the issue in detail what you found.
    `
    const result = await agent.run(supabaseQuery)
    return result
  }
  catch (error: any) {
    console.error('Error running Supabase MCP agent:', error)
    return { error: 'Supabase Agent execution failed.', details: error.message || String(error) }
  }
}

// --- Function 2: Create GitHub Issue ---
async function createGithubIssue(
  issueContext: string, // This will be the output from fetchSupabaseUserDetails
  userEmail: string, // For issue title or reference
): Promise<string | { error: string, details?: any }> {
  try {
    const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    let errorMessage = ''
    if (!githubToken)
      errorMessage += 'GITHUB_PERSONAL_ACCESS_TOKEN is not set. '
    if (!anthropicApiKey)
      errorMessage += 'ANTHROPIC_API_KEY is not set. '

    if (errorMessage) {
      console.error('Server configuration errors for GitHub step:', errorMessage)
      return { error: `Server configuration error: ${errorMessage.trim()}` }
    }

    // Configuration for GitHub MCP server
    const githubConfig: AppConfig = {
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
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: githubToken,
            GITHUB_TOOLSETS: 'issues',
          },
        },
      },
    }

    const client = MCPClient.fromDict(githubConfig)
    const llm = new ChatAnthropic({
      model: 'claude-3-opus-20240229', // Or your preferred model
      temperature: 0.1,
      apiKey: anthropicApiKey,
    })
    const agent = new MCPAgent({ llm, client, maxSteps: 500 }) // Adjust maxSteps

    const githubIssueQuery = `
      Based on the following context:
      ---
      ${issueContext}
      ---
      Create a GitHub issue on the repo https://github.com/edshen17/mcp-hackathon.
      The issue title should be: "User Issue: ${userEmail} - [Brief Summary of Problem]". You can infer the brief summary from the context.
      The issue body should contain all the details provided in the context above.
      Confirm the creation of the issue and provide the issue URL or number.
    `
    console.warn('Running GitHub agent with query:', githubIssueQuery)
    const result = await agent.run(githubIssueQuery)
    console.warn('GitHub agent result:', result)
    return result
  }
  catch (error: any) {
    console.error('Error running GitHub MCP agent:', error)
    return { error: 'GitHub Agent execution failed.', details: error.message || String(error) }
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

  // --- Call 1: Fetch Supabase Details ---
  const supabaseResult = await fetchSupabaseUserDetails(problemDescription!, userEmail!)
  const issueContext = (Array.isArray(supabaseResult) && supabaseResult.length > 0 && supabaseResult[0].text)
    ? supabaseResult[0].text
    : typeof supabaseResult === 'string' ? supabaseResult : 'Error: Could not extract text from Supabase result.'

  console.warn('Extracted issueContext:', issueContext) // Changed to console.warn

  const githubResult = await createGithubIssue(issueContext, userEmail!)

  if (typeof githubResult === 'object' && githubResult.error) {
    event.node.res.statusCode = 500 // Or a more specific error code
    return {
      success: false,
      step: 'github',
      dataFromSupabase: issueContext, // Include previous step's successful data for context
      error: githubResult.error,
      details: githubResult.details,
    }
  }

  return {
    success: true,
    supabaseOutput: issueContext,
    githubOutput: githubResult,
  }
})
