# GPT Bot Manager

## _*Currently in beta*_

### Streamline gpt bot creation for Discord, Telegram and other platforms.

### Overview
Deploy bots for various messaging platforms, starting with Discord and Telegram and soon expanding to Outlook, whatsapp, facebook and others. It abstracts the complexities of API connections, allowing you to focus on creating and designing the bots through a simple interface.

Create bots with different goals and unique behavior.

### Screenshots
##### Homepage - Bot list
![Homepage - Bot list](https://catalinberta.com/files/panko/panko-gpt/screenshots/01-homepage.png)
##### Bot creation form
![Bot creation form](https://catalinberta.com/files/panko/panko-gpt/screenshots/02-create-form.png)
##### Bot vector search
![Bot vector search](https://catalinberta.com/files/panko/panko-gpt/screenshots/03-create-vector-search.png)
##### Bot functions
![Bot functions](https://catalinberta.com/files/panko/panko-gpt/screenshots/05-functions.png)

### Features
- Easy Bot Creation: Deploy custom bots for Discord and Telegram (and soon others) through a user-friendly interface.
- Customizable Bot Settings: Tailor bot behavior by filling out forms — no coding required.
- Context: Customize the bot's behavior and scope to assist with various tasks
- Function tools: a set of configurable tools that the bot can use e.g. access urls/internet, the time etc.

### Planned Features (or already WIP)
- More functions/tools to expand gpt capabilities
- Skills (teacher, language partner, code assistant etc.)
- Move vector search from Atlas Cloud to local postgres

### Prerequisites
- Docker
- Discord and/or Telegram account
- OpenAI account
- MongoDB (cloud version has a free tier https://www.mongodb.com/cloud/atlas/register)

### Installation
- Clone the repository:
  `git clone https://github.com/catalinberta/panko-gpt.git`
- Navigate to the project directory: `cd panko-gpt`
- Rename `docker-compose.example.yml` to `docker-compose.yml`
- Fill environment variables in `docker-compose.yml` with the missing MongoDB Atlas data
- For Dev: 
  - docker compose build dev
  - docker compose up dev
- For Prod: 
  - docker compose build prod
  - docker compose up prod

### Running the Application
- Open the interface in your browser.
- For dev environment, use http://localhost:5003 (this uses the local server & reload)
- For prod environment, use http://localhost:5002

### Join discord
[Click here to join](https://eq6w.short.gy/discord-invite-github)

### Other links
- [Docker](https://hub.docker.com/repository/docker/catalinbertadev/panko-gpt)
- [Unraid](https://unraid.net/community/apps?q=panko-gpt)
- [Me](https://catalinberta.com)

### Contributing
Contributions are very welcome! Whether it's adding new features, improving documentation, or reporting bugs, please feel free to make a pull request or open an issue.

### License
This project is licensed under the MIT License.