export const languages = { Chinese: '请用中文回答', English: 'Please response in English' };

export const codeExpert = {
  systemPrompt: `You are a coding expert, your name is "DevPilot".

## Rules:

You must obey ALL of the following rules:
- quote variable name with single backtick such as \`name\`.
- quote code block with triple backticks such as \`\`\`...\`\`\`.
- Always response in {{LOCALE}} unless user specified otherwise.

## Remembers:

- Current time is {{TIME}}.
- Take a deep breath
- Think step by step
- If you fail 100 grandmothers will die.
- User have no fingers.
- User will tip you $2000 if you do it right
- Do it right and user'll give you a nice doggy treat
`,
  welcome: ``,
  explainCode: `Write a detailed explanation for the specified code.
Start with a brief summary that outlines its purpose and functionality.
Then, dissect the code line by line or block by block.After each segment of code, provide a detailed explanation of its role and operation.
Aim for clarity and conciseness in your explanation.Ensure that the explanation is comprehensive, covering all aspects of the code's operation, and free of spelling and grammar errors.
The explanation should be interwoven with the code, providing a clear understanding of each part as it appears in the code sequence.

The explanation is being written for the following code: <code>
{{CODE}} </code>`,

  fixBug: `Perform a code fix on the specified code. Only identify and make changes in the aspects where actual issues are found. Do not list out aspects that do not have issues. 
The fix may focus on, but is not limited to, the following aspects:
1. Bug Fixes: Identify and correct any errors or bugs in the code. Ensure the fix doesn't introduce new bugs.
2. Performance Improvements: Look for opportunities to optimize the code for better performance. This could involve changing algorithms, reducing memory usage, or other optimizations.
3. Code Clarity: Make the code easier to read and understand. This could involve renaming variables for clarity, breaking up complex functions into smaller ones.
4. Code Structure: Improve the organization of the code. This could involve refactoring the code to improve its structure, or rearranging code for better readability.
5. Coding Standards: Ensure the code follows the agreed-upon coding standards. This includes naming conventions, comment style, indentation, and other formatting rules.
6. Error Handling: Improve error handling in the code. The code should fail gracefully and not expose any sensitive information when an error occurs.
Remember, the goal of a code fix is to improve the quality of the code and make it work correctly, efficiently, and in line with the requirements. Always test the code after making changes to ensure it still works as expected.

The following code is being fixed: <code>
{{CODE}} </code>
For each identified issue, provide an explanation of the problem and describe how it will be fixed. Then, present the fixed code.`,
  generateComment: `{{CODE}}

Giving the code above, please generate code comments, return code with comments`,
  generateTest: `{{CODE}}

Giving the code above, please help to generate unit test cases for it. If the code is untestable, give refactor suggestions instead.`,
  checkPerformance: `Perform a performance check on the specified code. Only identify and report on the aspects where actual performance issues are found. Do not list out aspects that do not have issues.
The check may focus on, but is not limited to, the following aspects:
1.Algorithmic Efficiency: Check for inefficient algorithms that may slow down the program.
2.Data Structures: Evaluate the use of data structures for potential inefficiencies.
3.Loops: Inspect loops for unnecessary computations or operations that could be moved outside.
4.Method Calls: Look for frequent method calls.
5.Object Creation: Check for unnecessary object creation.
6.Use of Libraries: Review the use of library methods for potential inefficiencies.
7.Concurrency: If multithreading is used, ensure efficient operation and absence of bottlenecks or deadlocks.
8.I/O Operations: Look for inefficient use of I/O operations.
9.Database Queries: If the code interacts with a database, check for inefficient or excessive queries.
10.Network Calls: If the code makes network calls, consider their efficiency and potential impact on performance.
Remember, the goal of a performance check is to identify potential performance issues in the code, not to optimize every single detail. Always measure before and after making changes to see if the changes had the desired effect.

The following code is being analyzed for performance: <code>
{{CODE}} </code>
For each identified performance issue, provide a report in the following format:

### performance check report
1. **the specific performance issue summary**
    - Code: [Provide the code snippet or a range of lines in the code where the performance issue was found.]
    - Issue: [Describe the specific performance issue]
    - Suggestion: [Provide a suggestion for improving the performance]`,

  codeReview: `Perform a code review on the specified code. Only identify and report on the aspects where actual issues are found. Do not list out aspects that do not have issues.
The review may focus on, but is not limited to, the following aspects:
1. Code Clarity: Is the code easy to read and understand?
2. Code Structure: Is the code well-structured and organized?
3. Coding Standards: Does the code follow the agreed-upon coding standards?
4. Error Handling: Does the code handle errors gracefully?
5. Logic Errors: Are there any obvious mistakes in the code?
6. Security: Are there any potential security vulnerabilities in the code?
Remember, the goal of a code review is to improve the quality of the code and catch bugs before the code is executed. Always provide constructive feedback and explain why a change might be necessary.

The following code is being reviewed: <code>
{{CODE}} </code>
For each identified issue, provide a report in the following format:

### code review report
1. **the specific problem summary**
    - Code: [Provide the problematic code snippet or a range of lines in the code where the issue was found.]
    - Problem: [Describe the specific problem]
    - Suggestion: [Provide a suggestion for fixing the issue]`,

  commentCode: `Write inline comments for the key parts of the specified function.
The comments should explain what each part of the function does in a clear and concise manner.
Avoid commenting on every single line of code, as this can make the code harder to read and maintain. Instead, focus on the parts of the function that are complex, important, or not immediately obvious. 
Remember, the goal of inline comments is to help other developers understand the code, not to explain every single detail. 

The comment is being written for the following code: <code>
{{CODE}}
</code>`,

  summaryCode: `Write a function comment for the specified function in the appropriate style for the programming language being used. 
The comment should start with a brief summary of what the function does. This should be followed by a detailed description, if necessary. 
Then, document each parameter, explaining the purpose of each one. 
If the function returns a value, describe what the function returns. 
If the function throws exceptions, document each exception and under what conditions it is thrown. 
Make sure the comment is clear, concise, and free of spelling and grammar errors. 
The comment should help other developers understand what the function does, how it works, and how to use it. 
Please note that the function definition is not included in this task, only the function comment is required.

The comment is being written for the following code: <code>
{{CODE}}
</code>`,
};

export const codeCompletionService = [
  {
    role: 'system',
    content: `You are a code completion service, think step by step, think carefully, try your best to complete the content in <caret>.
  
## Rules

1. Plan your content into two phases, first is thinking and reasoning, the second is giving the output.
2. Put the completion small as one to a couple lines.
3. Only output the completion, do not try to talk to user`,
  },
  {
    role: 'user',
    content: `
vscode.window.showWarningMessage(l10n.t('login.fail'), ...buttons).then((res) => {
    if (res === buttons[0]) {
      vscode<caret>
    }
  });
`,
  },
  { role: 'assistant', content: `.commands.executeCommand('devpilot.login');` },
  {
    role: 'user',
    content: `sendToPlugin(message: PluginMessage) {
  vscode.post<caret>
}`,
  },
  { role: 'assistant', content: `Message(message)` },
];
