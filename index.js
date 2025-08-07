const { PermissionsBitField, EmbedBuilder, ButtonStyle, Client, GatewayIntentBits, ChannelType, Partials, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const config = require("./config.js");
const db = require("quick.db");

const client = new Client({
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.User,
    Partials.ThreadMember,
  ],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
});

client.login(config.token || process.env.TOKEN);

client.on("ready", async () => {
  console.log("Bot aktif!");
  const channel = config.channel;
  const as = client.channels.cache.get(channel);
  if (!as) return console.error("Belirtilen kanal bulunamadı.");

  const embed = new EmbedBuilder()
    .setColor("127896")
    .setAuthor({ name: "Revolt | Destek Sistemi", iconURL: as.guild.iconURL({ dynamic: true }) })
    .setDescription("Sunucumuzda destek oluşturabilmek için aşağıdaki butona basıp bir kategori seçmeniz gerekiyor.")
    .addFields(
      { name: '\u200B', value: '\u200B' },
      { name: "⚠️ Kullanıcı Bildir", value: "Bir Kullanıcıyı Bildirmek İçin.", inline: true },
      { name: "💸 Satın Alım", value: "Satın Alımlar İçin.", inline: true },
      { name: "⭐ Diğer", value: "Diğer Sebepler İçin.", inline: true },
    )
    .setThumbnail("https://cdn.discordapp.com/attachments/1016663875342569562/1045979609965015080/ravenDestek.png")
    .setFooter({ text: "discord.gg/revoltjb", iconURL: "https://cdn.discordapp.com/attachments/1016663875342569562/1045979609965015080/ravenDestek.png" });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel("Destek Talebi Oluştur")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("destek")
        .setEmoji("🎫")
    );

  await as.send({ embeds: [embed], components: [row] });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "destek") {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setEmoji("⚠️")
          .setStyle(ButtonStyle.Success)
          .setCustomId("Kullanıcı Bildir"),
        new ButtonBuilder()
          .setEmoji("💸")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("Satın Alım"),
        new ButtonBuilder()
          .setEmoji("⭐")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("Diğer Sebepler")
      );

    const embed = new EmbedBuilder()
      .setDescription("Hangi kategoriyi seçmek istiyorsun?")
      .setColor("127896");

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  const categories = ["Kullanıcı Bildir", "Satın Alım", "Diğer Sebepler"];
  if (categories.includes(interaction.customId)) {
    await interaction.deferUpdate();

    let ticketCount = db.get(`ticket_${interaction.guild.id}`) || 1;

    const channel = await interaction.guild.channels.create({
      name: `ticket-${ticketCount}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: config.staff,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Revolt - Destek Sistemi!", iconURL: interaction.guild.iconURL() })
      .setDescription("Hey, destek talebi açtığına göre önemli bir konu olmalı. Bu sürede birini etiketleme ve sakince sorununu belirt.")
      .addFields(
        { name: '\u200B', value: '\u200B' },
        { name: "Kullanıcı:", value: `${interaction.user.tag}`, inline: true },
        { name: "Sebep:", value: `${interaction.customId}`, inline: true },
        { name: "Destek Sırası:", value: `${ticketCount}`, inline: true }
      )
      .setColor("127896");

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setEmoji("📑")
          .setLabel("Kaydet Ve Kapat")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("kapat"),
        new ButtonBuilder()
          .setEmoji("<:bilgi:1026204345060036691>")
          .setLabel("Mesajlar")
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("mesaj")
      );

    db.set(`kapat_${channel.id}`, interaction.user.id);
    db.add(`ticket_${interaction.guild.id}`, 1);

    await channel.send({ embeds: [embed], components: [row] }).then((a) => a.pin());
  }

  if (interaction.customId === "mesaj") {
    const fs = require("fs");
    const datas = db.get(`mesaj_${interaction.channel.id}`);

    if (!datas || datas.length === 0) {
      fs.writeFileSync(`${interaction.channel.id}.json`, "Bu kanalda hiç bir mesaj bulunamadı!");
      return interaction.reply({ files: [`./${interaction.channel.id}.json`], ephemeral: true }).catch(() => {});
    }

    const dataText = datas.join("\n");
    fs.writeFileSync(`${interaction.channel.id}.json`, dataText);
    await interaction.reply({ files: [`./${interaction.channel.id}.json`], ephemeral: true }).catch(() => {});
  }

  if (interaction.customId === "kapat") {
    const id = db.get(`kapat_${interaction.channel.id}`);
    if (!id) return interaction.reply({ content: "Bilet sahibi bulunamadı.", ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(id, { ViewChannel: false });
    const embed = new EmbedBuilder()
      .setDescription("Bu destek talebi sonlandırıldı, umarım sorun çözülmüştür :)")
      .setColor("127896");

    await interaction.reply({ embeds: [embed] });
  }
});

client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (message.channel.name.includes("ticket")) {
    db.push(`mesaj_${message.channel.id}`, `${message.author.username}: ${message.content}`);
  }
});

process.on("unhandledRejection", async (error) => {
  console.log("Bir hata oluştu: " + error);
});

module.exports = client;
