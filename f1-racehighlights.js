// Importa o dotenv e configura
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { google } = require("googleapis");

// Cria o cliente do Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Carrega as variáveis de ambiente
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });

// Função para calcular as datas da última sexta-feira e próxima segunda-feira
function getLastFridayAndNextMonday() {
  const today = new Date();

  // Encontra a data da última sexta-feira
  const lastFriday = new Date(today);
  lastFriday.setDate(today.getDate() - ((today.getDay() + 2) % 7)); // Ajusta para sexta-feira anterior

  // Encontra a data da próxima segunda-feira
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7)); // Ajusta para segunda-feira seguinte

  return {
    lastFriday: lastFriday.toISOString(),
    nextMonday: nextMonday.toISOString(),
  };
}

// Função para verificar novos vídeos de Race Highlights entre Sexta e Segunda
async function checkNewVideo() {
  try {
    const { lastFriday, nextMonday } = getLastFridayAndNextMonday();

    const res = await youtube.search.list({
      part: "snippet",
      channelId: CHANNEL_ID,
      order: "date", // Ordenar por data (mais recente primeiro)
      maxResults: 5, // Para evitar spams, podemos pegar os 5 mais recentes
      q: "Race Highlights", // Filtro de pesquisa
      publishedAfter: lastFriday, // Publicados após a última sexta-feira
      publishedBefore: nextMonday, // Publicados antes da próxima segunda-feira
    });

    // Verifica se há vídeos
    if (res.data.items.length > 0) {
      const latestVideo = res.data.items[0];
      const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`;

      // Verifica se o título ou descrição não contém termos indesejados (ex: "FP2", "FP3")
      const videoTitle = latestVideo.snippet.title.toLowerCase();
      const videoDescription = latestVideo.snippet.description.toLowerCase();

      if (
        videoTitle.includes("race highlights") &&
        !videoTitle.includes("fp2") &&
        !videoTitle.includes("fp3") &&
        !videoDescription.includes("fp2") &&
        !videoDescription.includes("fp3")
      ) {
        // Enviar o link do vídeo para o canal do Discord
        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        channel.send(`Há highlights novos carago: ${videoUrl}`);
      } else {
        console.log("Não quero FP2 nem FP3 caragos");
      }
    } else {
      console.log(
        "Nenhum vídeo de Race Highlights encontrado entre Sexta e Segunda.",
      );
    }
  } catch (error) {
    console.error("Erro ao verificar vídeos do YouTube:", error);
  }
}

// Configuração do bot no Discord
client.once("ready", () => {
  console.log("Bot online! POWER");
  checkNewVideo(); // Verificar vídeo ao iniciar
  setInterval(checkNewVideo, 60000); // Verificar de 60 em 60 segundos
});

client.login(DISCORD_TOKEN);
