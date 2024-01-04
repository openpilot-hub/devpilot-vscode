import { createAssistantMessage, createUserMessage } from "./messages"
import { Message } from "./typing"

export function mockMessages(): Message[] {
  const assistantAnswer = `
  ## Hello from React
  
  React is a JavaScript library for building user interfaces.
  
  single line of code \`console.log("Hello World")\`
  
  \`\`\`
  some plain text
  some plain text
  some plain text
  some plain text
  some plain text
  some plain text
  \`\`\`
  
  \`\`\`tsx {5-9}
  import React from'react'
  import { useState } from 'react'
  import './App.css'
  
  function App() {
    const [count, setCount] = useState(0);
    return (
      <div>
      </div>
    )
  }
  export default App
  \`\`\``

  return [
    createUserMessage('tell me about react', '11:00'),
    createAssistantMessage(assistantAnswer, '11:01'),
  ]
}