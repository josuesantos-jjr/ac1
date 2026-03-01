import { Groq } from 'groq-sdk';

// É altamente recomendável usar variáveis de ambiente para suas chaves de API.
// Por exemplo, você pode definir GROQ_API_KEY="sua_chave_aqui" no seu ambiente.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  console.log("Chave da API Groq sendo utilizada (últimos 5 caracteres):", groq.apiKey ? groq.apiKey.slice(-5) : "Não definida");
  try {
    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "user",
          "content": "OI, tudo bem?"
        }
      ],
      "model": "qwen/qwen3-32b", // Modelo sugerido para teste, o modelo original "openai/gpt-oss-20b" pode não estar disponível no Groq diretamente.
      "temperature": 1,
      "max_completion_tokens": 8192,
      "top_p": 1,
      "stream": true,
      "reasoning_effort": "default",
      "stop": null
    });

    for await (const chunk of chatCompletion) {
      process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }
    console.log("\nTeste da API Groq concluído com sucesso!");
  } catch (error) {
    console.error("Erro ao chamar a API Groq:", error);
  }
}

main();