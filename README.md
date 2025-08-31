# PankoGPT - AI Companion Platform ![Beta](https://img.shields.io/badge/status-beta-yellow) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## _*Currently in alpha*_

### Create your own unique AI Companions on Discord, Telegram, WhatsApp and soon other platforms.

### 🚀 Overview

Create and Deploy AI Companions for your friends, and/or family across various messaging platforms, starting with WhatsApp, Discord and Telegram. With **PankoGPT**, you can:

-   **Easily Create Custom AI Companions**: Deploy companions with specific goals and behaviors tailored to each need.
-   **Customizable Settings**: Configure companion behavior by filling out straightforward forms—no coding required.
-   **Contextual Understanding**: Define the scope and context in which your companion operates.
-   **Function Tools**: Equip your companions with configurable tools like URL access, time fetching, and more.

### ![Screenshots](https://img.shields.io/badge/Screenshots-E74C3C?logo=image&logoColor=white)

Homepage

![Homepage - Companion list](https://catalinberta.com/files/panko/panko-gpt/screenshots/v1/01-homepage.png)

Create new companion platform selection

![Companion creation form](https://catalinberta.com/files/panko/panko-gpt/screenshots/v1/02-create.png)

Create new discord companion form

![Companion vector search](https://catalinberta.com/files/panko/panko-gpt/screenshots/v1/03-form.png)

Knowledgebase section

![Companion functions](https://catalinberta.com/files/panko/panko-gpt/screenshots/v1/04-knowledgebase.png)

Selecting Function/Tools

![Companion functions](https://catalinberta.com/files/panko/panko-gpt/screenshots/v1/05-tools.png)

Settings

![Companion functions](https://catalinberta.com/files/panko/panko-gpt/screenshots/v1/06-settings.png)

## ![Features](https://img.shields.io/badge/Features-8E44AD?logo=features&logoColor=white) Features

-   **User-Friendly Interface**: Deploy custom companions for WhatsApp, Discord and Telegram (and soon other platforms) without the need for deep technical knowledge of their integration.
-   **Customizable Behavior**: Fine-tune your companions' responses and actions using simple forms.
-   **Contextual Companions**: Create companions that understand and respond based on context, enhancing their utility.
-   **Configurable Tools**: Extend your companion’s capabilities with additional functions, such as internet access, time-based responses, etc.

## ![Planned Features](https://img.shields.io/badge/Planned%20Features-F39C12?logo=rocket&logoColor=white) Planned Features (or already WIP)

-   **Expanded Functionality**: More tools to enhance GPT companion capabilities.
-   **Skill Development**: Pre-built skills for teaching, language practice, coding assistance, and more.
-   **Vector Search Optimization**: Transition vector search from Atlas Cloud to local PostgreSQL for better performance.

## ![Prerequisites](https://img.shields.io/badge/Prerequisites-0D6EFD?logo=docker&logoColor=white) Prerequisites

Before you begin, ensure you have met the following requirements:

-   **Docker**
-   **WhatsApp, Discord and/or Telegram account**
-   **OpenAI account**
-   **MongoDB** (Cloud version with a free tier available [here](https://www.mongodb.com/cloud/atlas/register))

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

3. Rename `docker-compose.example.yml` to `docker-compose.yml`

4. Rename `docker-compose.dev.example.yml` to `docker-compose.dev.yml`

5. Fill in the missing environment variables (e.g. Atlas credentials, OpenAI key etc.) in `docker-compose.yml`.

### ![For Development](https://img.shields.io/badge/For%20Development-FF5733?logo=visual-studio-code&logoColor=white) For Development

1. Build the development environment:

    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml build
    ```

2. Start the development environment:
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up
    ```

### ![For Production](https://img.shields.io/badge/For%20Production-28A745?logo=heroku&logoColor=white) For Production

1. Build the production environment:

    ```bash
    docker compose -f docker-compose.yml build
    ```

2. Start the production environment:
    ```bash
    docker compose -f docker-compose.yml up
    ```

### ![Running the Application](https://img.shields.io/badge/Running%20the%20Application-3498DB?logo=server&logoColor=white) Running the Application

-   Open your browser and go to [http://localhost:5005](http://localhost:5005)

## ![Community](https://img.shields.io/badge/Community-7289DA?logo=discord&logoColor=white) Community

[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord&logoColor=white)](https://eq6w.short.gy/discord-invite-github)

Join the Discord community to connect with other users, share ideas, and get support.

## ⭐️ Other links

-   [Docker](https://hub.docker.com/repository/docker/catalinbertadev/panko-gpt)
-   [Unraid](https://unraid.net/community/apps?q=panko-gpt)
-   [Me](https://catalinberta.com)

## 🤝 Contributing

Contributions are very welcome! Whether it's adding new features, improving documentation, or reporting bugs, please feel free to make a pull request or open an issue.

## 📃 License

This project is licensed under the MIT License.
