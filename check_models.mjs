
const apiKey = "AIzaSyDcmPjyNbYiYAv-SoSGRbgu81n4MQ89SKA";

async function listModels() {
    try {
        const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await result.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                // Filter for generateContent
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
