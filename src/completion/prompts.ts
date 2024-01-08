export const language = `Please response in {{LOCALE}}`;

export const codeExpert = {
  systemPrompt: `You are a coding expert.

You must obey ALL of the following rules:
- quote variable name with single backtick such as \`name\`.
- quote code block with triple backticks such as \`\`\`...\`\`\`.`,
  explainCode: `{{CODE}}

Giving the code above, please explain it in detail, line by line.`,
  fixBug: `{{CODE}}

Giving the code above, please help to fix it:
- Fix any typos or grammar issues.
- Use better names as replacement to magic numbers or arbitrary acronyms.
- Simplify the code so that it's more straight forward and easy to understand.
- Optimize it for performance reasons.
- Refactor it using best practice in software engineering.
  
Must only provide the code to be fixed and explain why it should be fixed.`,
  generateComment: `{{CODE}}

Giving the code above, please generate code comments, return code with comments`,
  generateTest: `{{CODE}}

Giving the code above, please help to generate unit test cases for it. If the code is untestable, give refactor suggestions instead.`,
  checkPerformance: `{{CODE}}

Giving the code above, please fix any performance issues.
Remember you are very familiar with performance optimization.`,
  codeReview: `{{CODE}}

Giving the code above, please review the code line by line
- Think carefully, you should be extremely careful.
- Find out if any bugs exists.
- Reveal any bad smell in the code.
- Give optimization or best practice suggestion.`
};
