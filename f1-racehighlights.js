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

let lastVideoUrl = null; // Guarda o último vídeo encontrado

// Função para calcular a última sexta-feira
function getLastFriday() {
  const today = new Date();
  const lastFriday = new Date(today);
  lastFriday.setDate(today.getDate() - ((today.getDay() + 2) % 7)); // Ajusta para sexta-feira anterior
  return lastFriday.toISOString();
}

// Função para verificar novos vídeos de Race Highlights
async function checkNewVideo() {
  try {
    const lastFriday = getLastFriday();

    const res = await youtube.search.list({
      part: "snippet",
      channelId: CHANNEL_ID,
      order: "date",
      maxResults: 5, // Pega os 5 mais recentes
      q: "Race Highlights", // Filtro de pesquisa
      publishedAfter: lastFriday, // Publicados após a última sexta-feira
    });

    console.log("Vídeos encontrados:");
    res.data.items.forEach((video) => console.log(video.snippet.title));

    if (res.data.items.length > 0) {
      const latestVideo = res.data.items[0];
      const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`;
      const videoTitle = latestVideo.snippet.title.toLowerCase();

      if (
        videoTitle.includes("race highlights") &&
        !videoTitle.includes("fp2") &&
        !videoTitle.includes("fp3")
      ) {
        lastVideoUrl = videoUrl; // Guarda o último vídeo

        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        channel.send(`Há highlights novos carago: ${videoUrl}`);
      } else {
        console.log("Não quero FP2 nem FP3 caragos");
      }
    } else {
      console.log("Nenhum vídeo de Race Highlights encontrado.");
    }
  } catch (error) {
    console.error("Erro ao verificar vídeos do YouTube:", error);
  }
}

// Comando !ultimo para enviar o último vídeo encontrado
client.on("messageCreate", async (message) => {
  if (message.content === "!ultimo") {
    if (lastVideoUrl) {
      message.channel.send(`Aqui está o último vídeo: ${lastVideoUrl}`);
    } else {
      message.channel.send("Ainda não encontrei nenhum highlights, carago!");
    }
  }
});

// Configuração do bot no Discord
client.once("ready", () => {
  console.log("Bot online! POWER");
  checkNewVideo(); // Verifica ao iniciar
  setInterval(checkNewVideo, 60000); // Verifica a cada 60 segundos
});

client.login(DISCORD_TOKEN);
