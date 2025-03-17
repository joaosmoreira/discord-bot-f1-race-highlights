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

// Guarda o último vídeo enviado
let lastVideoUrl = "";

// Função para buscar o vídeo mais recente de "Race Highlights"
async function checkNewVideo(sendMessage = true) {
  try {
    const res = await youtube.search.list({
      part: "snippet",
      channelId: CHANNEL_ID,
      order: "date", // Ordenar por data (mais recente primeiro)
      maxResults: 1, // Apenas o vídeo mais recente
      q: "Race Highlights", // Filtro de pesquisa
    });

    if (res.data.items.length > 0) {
      const latestVideo = res.data.items[0];
      const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`;
      const videoTitle = latestVideo.snippet.title.toLowerCase();

      if (
        videoTitle.includes("race highlights") &&
        !videoTitle.includes("fp2") &&
        !videoTitle.includes("fp3")
      ) {
        if (videoUrl !== lastVideoUrl || !sendMessage) {
          lastVideoUrl = videoUrl;
          if (sendMessage) {
            const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
            channel.send(`Há highlights novos carago: ${videoUrl}`);
          }
        }
      } else {
        console.log("Último vídeo não é um Race Highlights válido.");
      }
    } else {
      console.log("Nenhum vídeo encontrado.");
    }
  } catch (error) {
    console.error("Erro ao verificar vídeos do YouTube:", error);
  }
}

// Evento quando o bot está pronto
client.once("ready", async () => {
  console.log("Bot online! POWER");
  await checkNewVideo(); // Verificar o vídeo ao iniciar
  setInterval(checkNewVideo, 60000); // Verificar a cada 60 segundos
});

// Evento para ouvir mensagens no chat
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignora mensagens de outros bots

  if (message.content.toLowerCase() === "!ultimo") {
    if (lastVideoUrl) {
      message.channel.send(`Último vídeo de Race Highlights: ${lastVideoUrl}`);
    } else {
      await checkNewVideo(false); // Busca o vídeo sem enviar mensagem automática
      if (lastVideoUrl) {
        message.channel.send(
          `Último vídeo de Race Highlights: ${lastVideoUrl}`,
        );
      } else {
        message.channel.send("Ainda não há highlights disponíveis carago!");
      }
    }
  }
});

// Login do bot no Discord
client.login(DISCORD_TOKEN);
