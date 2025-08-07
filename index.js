require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

client.once(Events.ClientReady, () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'kur') {
            const embed = new EmbedBuilder()
                .setTitle('NOVA JB - DESTEK SISTEMI')
                .setDescription(`👋 **Merhaba!** Aşağıdan ihtiyacın olan destek kategorisini seçerek bize ulaşabilirsin.

________________________________________

🔧 **Ticket Kuralları:**
🔒 - Yanlış kategoriye açılan talepler kapatılır
🔴 - Yetkililere etiket atma
________________________________________

© discord.gg/trmarket`)
                .setImage('https://cdn.discordapp.com/attachments/1379099449401278464/1402737267264454779/static.png')
                .setColor('#8000ff');

            const select = new StringSelectMenuBuilder()
                .setCustomId('destek_menu')
                .setPlaceholder('Lütfen destek talebi nedeninizi seçiniz.')
                .addOptions([
                    {
                        label: 'Satın Alım',
                        description: 'Küçük skin veya yetki alımı için.',
                        value: 'satin_alim',
                        emoji: '💜'
                    },
                    {
                        label: 'Bug & Şikayet Bildir',
                        description: 'Bug veya Şikayet bildirmek için.',
                        value: 'bug_sikayet',
                        emoji: '💚'
                    },
                    {
                        label: 'Diğer',
                        description: 'Diğer sebeplerden dolayı ticket açıyorsanız.',
                        value: 'diger',
                        emoji: '❤️'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(select);
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'destek_menu') {
            const kategori = interaction.values[0];
            const kanal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    }
                ]
            });

            kanal.send({
                content: `<@${interaction.user.id}> destek talebin alındı! (${kategori})`
            });

            await interaction.reply({ content: 'Destek talebin için kanal oluşturuldu!', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
