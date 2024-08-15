# PankoGPT - AI Bot Manager ![Beta](https://img.shields.io/badge/status-beta-yellow) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## _*Currently in beta*_

### Streamline gpt bot creation for Discord, Telegram and other platforms.

### 🚀 Overview
Deploy and manage bots for your friends and family across various messaging platforms, starting with Discord and Telegram, with planned support for Outlook, WhatsApp, Facebook, and others. With **GPT Bot Manager**, you can:

- **Easily Create Custom Bots**: Deploy bots with specific goals and behaviors tailored to your needs.
- **Customizable Settings**: Configure bot behavior by filling out straightforward forms—no coding required.
- **Contextual Understanding**: Define the scope and context in which your bot operates.
- **Function Tools**: Equip your bots with configurable tools like URL access, time fetching, and more.

### ![Screenshots](https://img.shields.io/badge/Screenshots-E74C3C?logo=image&logoColor=white) Screenshots

| Screenshot | Description |
|------------|-------------|
| ![Homepage - Bot list](https://catalinberta.com/files/panko/panko-gpt/screenshots/01-homepage.png) | Homepage showing the list of bots |
| ![Bot creation form](https://catalinberta.com/files/panko/panko-gpt/screenshots/02-create-form.png) | Form used to create a new bot |
| ![Bot vector search](https://catalinberta.com/files/panko/panko-gpt/screenshots/03-create-vector-search.png) | Interface for bot vector search |
| ![Bot functions](https://catalinberta.com/files/panko/panko-gpt/screenshots/05-functions.png) | Overview of bot functions |

## ![Features](https://img.shields.io/badge/Features-8E44AD?logo=features&logoColor=white) Features
- **User-Friendly Interface**: Deploy custom bots for Discord and Telegram (and soon other platforms) without the need for deep technical knowledge.
- **Customizable Behavior**: Fine-tune your bots' responses and actions using simple forms.
- **Contextual Bots**: Create bots that understand and respond based on context, enhancing their utility.
- **Configurable Tools**: Extend your bot’s capabilities with additional functions, such as internet access, time-based responses, etc.

## ![Planned Features](https://img.shields.io/badge/Planned%20Features-F39C12?logo=rocket&logoColor=white) Planned Features (or already WIP)

- **Expanded Functionality**: More tools to enhance GPT bot capabilities.
- **Skill Development**: Pre-built skills for teaching, language practice, coding assistance, and more.
- **Vector Search Optimization**: Transition vector search from Atlas Cloud to local PostgreSQL for better performance.
  
## ![Prerequisites](https://img.shields.io/badge/Prerequisites-0D6EFD?logo=docker&logoColor=white) Prerequisites

Before you begin, ensure you have met the following requirements:

- **Docker**
- **Discord and/or Telegram account**
- **OpenAI account**
- **MongoDB** (Cloud version with a free tier available [here](https://www.mongodb.com/cloud/atlas/register))

## 📝 Installation

To install and run the application locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/catalinberta/panko-gpt.git
   ```

2. Navigate to the project directory:
   ```bash
   cd panko-gpt
   ```

3. Rename the example Docker Compose file:
   ```bash
   mv docker-compose.example.yml docker-compose.yml
   ```

4. Fill in the missing environment variables (e.g. Atlas credentials, OpenAI key etc.) in `docker-compose.yml`.

### ![For Development](https://img.shields.io/badge/For%20Development-FF5733?logo=visual-studio-code&logoColor=white) For Development

1. Build the development environment:
   ```bash
   docker compose build development
   ```

2. Start the development environment:
   ```bash
   docker compose up development
   ```

### ![For Production](https://img.shields.io/badge/For%20Production-28A745?logo=heroku&logoColor=white) For Production

1. Build the production environment:
   ```bash
   docker compose build production
   ```

2. Start the production environment:
   ```bash
   docker compose up production
   ```

### ![Running the Application](https://img.shields.io/badge/Running%20the%20Application-3498DB?logo=server&logoColor=white) Running the Application

- **Development**: Open your browser and go to [http://localhost:5003](http://localhost:5003) (local server with auto-reload).
- **Production**: Open your browser and go to [http://localhost:5002](http://localhost:5002).

## ![Community](https://img.shields.io/badge/Community-7289DA?logo=discord&logoColor=white) Community

[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord&logoColor=white)](https://eq6w.short.gy/discord-invite-github)

Join our Discord community to connect with other users, share ideas, and get support.

## ⭐️ Other links
- [Docker](https://hub.docker.com/repository/docker/catalinbertadev/panko-gpt)
- [Unraid](https://unraid.net/community/apps?q=panko-gpt)
- [Me](https://catalinberta.com)

## 🤝 Contributing
Contributions are very welcome! Whether it's adding new features, improving documentation, or reporting bugs, please feel free to make a pull request or open an issue.

## 📃 License
This project is licensed under the MIT License.
