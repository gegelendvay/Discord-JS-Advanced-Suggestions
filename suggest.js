const Discord = require('discord.js');

module.exports = client => {

    client.on('message', async (message) => {
        if(message.author.bot) return;
        if(!message.guild) return;
        if(message.partial) await message.fetch();

        //================================= C O N F I G =================================

        // Prefix
        let prefix = "" // Specify your prefix

        // Emojis - Get the ID by typing in an emoji and putting \ in front of it. When you send it, its ID should appear.
        let upVoteEmoji = ""; // Upvote emoji ID
        let downVoteEmoji = ""; // Downvote emoji ID

        // ID'S
        let suggestionGuildID = ""; // Suggestion guild ID
        let suggestionChannelID = ""; // Suggestion channel ID
        let toDoChannelID = ""; // ToDo channel ID for staff to keep track of approved suggestions
        let staffRoleID = ""; // Staff role - members with this role will be able to respond to suggestions

        // Messages
        let statusMessage = "📊 Waiting for community feedback..."; // Default status message
        let approveMessage = "✅ Approved suggestion! Expect this soon."; // Approved status message
        let denyMessage = "❌ Thank you for your suggestion, however, this idea won't be implemented in the near future."; // Denied status message
        let maybeMessage = "Thank you for your suggestion, we will consider this it later-on!"; // Maybed status message
        let footerText = "Do you have a suggestion? Simply write it in this channel. Made by Gege#6988"; // Default footer message

        // Avatars and icons
        let serverIcon = message.guild.iconURL({format: "png", dynamic: true, size: 512});
        let icon = message.member.user.displayAvatarURL({format: "png", dynamic: true, size: 4096});

        // Embeds
        const imageEmbed = new Discord.MessageEmbed()
            .setColor("#ff5353")
            .setAuthor("Suggestion Notice", serverIcon)
            .setDescription(`If you would like to send an image with your suggestion, please use Discord image links or an image sharing service like [Imgur](https://imgur.com/upload).\nAfter uploading your image, copy the link and paste it into your suggestion.`)
            .setTimestamp()

        const fewEmbed = new Discord.MessageEmbed()
            .setColor("#ff5353")
            .setAuthor("Suggestion Notice", serverIcon)
            .setDescription(`Your suggestion didn't contain at least 20 characters.\nIf you could, please describe your suggestion more.`)
            .setTimestamp()

        //===============================================================================

        if(!suggestionChannelID) {
            return;
        }

        if(message.channel.id === suggestionChannelID) {
            const suggester = message.author;

            if(message.attachments.size > 0) return message.delete().then(suggester.send(imageEmbed));
            if(message.content.length < 20) return message.delete().then(suggester.send(fewEmbed));

            message.delete({ timeout: 50 }); // Deletes original message, so it can be replaced with the bot's embed. Has a short timeout, so images and suggestions under 20 characters can be deleted without being turned into embeds.

            const suggestionEmbed = new Discord.MessageEmbed()
                .setColor("YELLOW")
                .setAuthor(message.author.tag, icon)
                .setDescription("**Suggestion**\n" + message.content + "\n")
                .addField("Status", statusMessage, true)
                .setFooter(footerText)

            message.channel.send(suggestionEmbed)
                .then(message => {
                    message.react(upVoteEmoji);
                    message.react(downVoteEmoji);

                    const embedID = message.id;
                    const suggestionLink = `https://discord.com/channels/${suggestionGuildID}/${suggestionChannelID}/${embedID}`; // Dm the user about his/her suggestion - ...guildID/channelID/messageID

                    const confirmationEmbed = new Discord.MessageEmbed()
                        .setColor("#ff5353")
                        .setAuthor("We have received your suggestion.", serverIcon)
                        .setDescription(`You can follow your suggestion's status [here](${suggestionLink}).`)
                        .setTimestamp()
                        
                    suggester.send(confirmationEmbed)
                        .catch(error => {
                            console.log(error)
                                return;
                        });
                })
        }

        // Response command, permissions and arguments
        if(message.content.startsWith(`${prefix}suggestion`)) { // Response command: *suggestion <action> <messageID> [reason]
            if(!staffRoleID || staffRoleID === "null") {
                if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permission to do this.")
            }else {
                if(!message.member.roles.cache.has(staffRoleID.id) && !message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permissin to do this.")
            }

            const args = message.content.split(" ");
            let reason;

            // No arguments provided
            if(!args[1]) return message.reply(`The command usage is: \`${prefix}suggestion <approve / deny / maybe> <suggestion_id> [reason]\``)
                .then(message => {
                    message.delete({ timeout: 10000 })
                });

            // No message ID provided
            if (!args[2]) return message.reply("Please provide a message ID.")
                .then(message => {
                    message.delete({ timeout: 10000 })
                });

            // Invalid message ID provided
            if(args[2].length !== 18) return message.reply("You proided an invalid message ID.")
                .then(message => {
                    message.delete({ timeout: 10000 })
                });

            // Reason
            if(args[3]) reason = "Reason: " + args.slice(3).join(" ")
            else reason = "";

            // Missing channels
            const channel = message.guild.channels.cache.get(suggestionChannelID)
            if (!channel) {
              return message.reply("It seems as if the suggestions channel doesn't exists!")
                .then(message => {
                    message.delete({ timeout: 10000 })
                });
            }

            const targetEmbed = await channel.messages.fetch(args[2], false, true)
            if (!targetEmbed) {
                return message.reply("It seems as if the suggestion doesn't exist!")
                    .then(message => {
                        message.delete({ timeout: 10000 })
                    });
            }

            const oldEmbed = targetEmbed.embeds[0]
            if(!oldEmbed) return message.reply("Not a suggestion.")
                .then(message => {
                    message.delete({ timeout: 10000 })
                });
            
            let color;
            let statusMessage;
            let statusLink = `https://discord.com/channels/${suggestionGuildID}/${suggestionChannelID}/${args[2]}`; // Link to inform staff about the staus update for a suggestion - not the best solution, but it works
            let toDoChannel = message.guild.channels.cache.find(channel => channel.id === toDoChannelID);

            switch(args[1]) {
                case "approve":
                    color = "#32CD32";
                    statusMessage = `${approveMessage} ${reason}`;  
                    await message.channel.send(
                        new Discord.MessageEmbed()
                            .setColor(color)
                            .setDescription(`📨 | Updated [suggestion](${statusLink}) status to: \`Approved\`.\n**By:** ${message.author}`)
                            .setTimestamp()
                        )
                        const approvedEmbed = new Discord.MessageEmbed()
                            .setColor("#ff5353")
                            .setTitle("Approved suggestion")
                            .setDescription(oldEmbed.description)
                            .addField("Click here to see the suggestion",`[Link](${statusLink})`)
                            .setFooter(`Approved by: ${message.author.tag}`)
                            .setTimestamp()

                        toDoChannel.send(approvedEmbed);
                break;
                
                case "deny":
                    color = "#ff5353";
                    statusMessage = `${denyMessage} ${reason}`;  
                    await message.channel.send(
                        new Discord.MessageEmbed()
                            .setColor(color)
                            .setDescription(`📨 | Updated [suggestion](${statusLink}) status to: \`Denied\`.\n**By:** ${message.author}`)
                            .setTimestamp()
                        );
                break;

                case "maybe":
                    color = "#ff712e";
                    statusMessage = `${maybeMessage} ${reason}`;  
                    await message.channel.send(
                        new Discord.MessageEmbed()
                            .setColor(color)
                            .setDescription(`📨 | Updated [suggestion](${statusLink}) status to: \`Maybe\`.\n**By:** ${message.author}`)
                            .setTimestamp()
                        );
                break;
            }

            // Response embed constructing
            const responseEmbed = new Discord.MessageEmbed()
                .setAuthor(oldEmbed.author.name, oldEmbed.author.iconURL)
                .setColor(color)
                .setDescription(oldEmbed.description)
                .setFooter(`Response by: ${message.author.tag}`)

                if (oldEmbed.fields.length === 1) {
                    responseEmbed.addField("Status", statusMessage)
                }
            targetEmbed.edit(responseEmbed)
        }
    })
}