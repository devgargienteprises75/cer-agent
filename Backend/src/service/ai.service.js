import { ChatOpenRouter } from '@langchain/openrouter'
import config from '../config/config.js'

const model = new ChatOpenRouter({
    apiKey: config.OPENROUTER_API_KEY,
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
})

async function decideCat({ description }) {
    const aiResponse = await model.invoke([
        {
            role: "system",
            content: `
                    You are a helpful category summarizer.
                    The user gives you detailed description of why customer return without buying anything. You have to decide in which category this reason is belong to. These is the category list, the strict rule is you have to decide category only from these list. The lists are:

                    1. Costly
                    2. New Requirement
                    3. Limited Variety
                    4. Only Visiting
                    5. Poor Quality
                    6. No Staff Support
                    7. Long Waiting
                    8. Price Negotiation
                    9. Out of Stock
                    10. Other

                    Use the customer's stated reason and select the best fit. Use "Other" if none fit. Reply with only the exact category name—no explanation or punctuation.
                `
        },
        {
            role: "human",
            content: description
        }
    ])

    return aiResponse;
}

export default decideCat;