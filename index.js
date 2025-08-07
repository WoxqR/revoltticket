require("dotenv").config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const config = require("./config.js");
const db = require("quick.db");

const client = new Client({
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
  const channel = client.channels.cache.get(config.channel);
  if (!channel) return console.log("⛔ Kanal bulunamadı.");

  const embed = new EmbedBuilder()
    .setColor("Random")
    .setAuthor({ name: "Revolt | Destek Sistemi" })
    .setDescription("Destek almak için aşağıdaki butona tıklayın ve kategori seçin.")
    .addFields(
      { name: "⚠️ Kullanıcı Bildir", value: "Bir kullanıcıyı şikayet edin." },
      { name: "💸 Satın Alım", value: "Satın alma sorunları." },
      { name: "⭐ Diğer", value: "Diğer konular." }
    )
    .setFooter({ text: "discord.gg/revoltjb" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("destek-olustur")
      .setLabel("🎫 Destek Talebi Oluştur")
      .setStyle(ButtonStyle.Primary)
  );

  channel.send({ embeds: [embed], components: [row] });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // Ana buton
  if (interaction.customId === "destek-olustur") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kategori-kullanici").setLabel("⚠️ Kullanıcı Bildir").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("kategori-satin").setLabel("💸 Satın Alım").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("kategori-diger").setLabel("⭐ Diğer").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ content: "Lütfen bir kategori seçin:", components: [row], ephemeral: true });
  }

  // Kategoriye göre ticket aç
  if (interaction.customId.startsWith("kategori-")) {
    const sebep = interaction.customId.replace("kategori-", "");
    const data = db.get(`ticket_${interaction.guild.id}`) || 1;
    const channelName = `ticket-${data}`;

    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: config.staff, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    db.add(`ticket_${interaction.guild.id}`, 1);
    db.set(`sahip_${ticketChannel.id}`, interaction.user.id);
    db.set(`sebep_${ticketChannel.id}`, sebep);

    const embed = new EmbedBuilder()
      .setTitle("🎟️ Destek Talebi Açıldı")
      .addFields(
        { name: "Kullanıcı", value: interaction.user.tag, inline: true },
        { name: "Sebep", value: sebep, inline: true },
        { name: "Kanal", value: `<#${ticketChannel.id}>` }
      )
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kapat").setLabel("📪 Kapat").setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ embeds: [embed], components: [row] });
    return interaction.followUp({ content: `✅ Kanal oluşturuldu: <#${ticketChannel.id}>`, ephemeral: true });
  }

  // Ticket kapatma
  if (interaction.customId === "kapat") {
    const userId = db.get(`sahip_${interaction.channel.id}`);
    if (interaction.user.id !== userId && !interaction.member.roles.cache.has(config.staff)) {
      return interaction.reply({ content: "⛔ Bu kanalı kapatma yetkiniz yok.", ephemeral: true });
    }

    await interaction.reply({ content: "🕒 Kanal 5 saniye içinde silinecek." });
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }
});

client.login(config.token);
