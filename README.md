# QSpeech Assistant

A modern speech assistant application built with React, TypeScript, and Express.

## Features

- Speech recognition and processing
- Real-time pose detection
- Modern UI with Tailwind CSS
- Type-safe development with TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/qspeech-assistant.git
cd qspeech-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
```

4. Set up the database:
```bash
npm run db:push
```

## Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To build the application for production:

```bash
npm run build
```

## Deployment

The application can be deployed to any Node.js hosting platform. Here are the steps for deployment:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 