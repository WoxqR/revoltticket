import { Client, GatewayIntentBits, Partials, Routes, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { config } from 'dotenv';
import express from 'express';
import { REST } from '@discordjs/rest';

config();

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('Bot Aktif'));
app.listen(PORT, () => console.log(`Uptime portu: ${PORT}`));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`${client.user.tag} aktif!`);
  registerCommands();
});

async function registerCommands() {
  const commands = [{
    name: 'kur',
    description: 'Destek sistemi embedini gönderir'
  }];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands });
  console.log('Komut yüklendi: /kur');
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'kur') {
    const embed = new EmbedBuilder()
      .setTitle('NOVA JB - DESTEK SISTEMI')
      .setDescription(`👋 **Merhaba!** Aşağıdan ihtiyacın olan destek kategorisini seçerek bize ulaşabilirsin.

───────────────

🔧 **Ticket Kuralları:**
🔒 Yanlış kategoriye açılan talepler kapatılır
🔴 Yetkililere etiket atma

───────────────`)
      .setImage('https://cdn.discordapp.com/attachments/1137360272441894962/1247518471491999774/37a31064-ae2d-46a9-9719-b8f72f5ac25c.png?ex=666f13d1&is=666dc251&hm=9e4f785b0c2755b2db1c258f5dd70aabfa2e81e10df25b7ff0210aa9f021d37f&')
      .setColor('#9b59b6')
      .setFooter({ text: '© discord.gg/trmarket' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('destek_menu')
      .setPlaceholder('Lütfen destek talebi nedeninizi seçiniz.')
      .addOptions([
        {
          label: 'Genel Destek',
          description: 'Genel konularda yardım almak için.',
          value: 'genel_destek'
        },
        {
          label: 'Satın Alma Sorunu',
          description: 'Ödeme & alışveriş desteği için.',
          value: 'odeme_sorunu'
        },
        {
          label: 'Şikayet',
          description: 'Bir kullanıcıyı şikayet etmek için.',
          value: 'sikayet'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'destek_menu') {
    const categoryName = {
      genel_destek: 'Genel Destek',
      odeme_sorunu: 'Satın Alma',
      sikayet: 'Şikayet'
    }[interaction.values[0]];

    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        }
      ],
      topic: `${interaction.user.tag} | Kategori: ${categoryName}`
    });

    await ticketChannel.send({
      content: `<@${interaction.user.id}> Hoş geldin, destek ekibi yakında seninle ilgilenecek.`
    });

    await interaction.reply({
      content: `✅ Destek talebin oluşturuldu: ${ticketChannel}`,
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
