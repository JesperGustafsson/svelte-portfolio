export const projects = [
    {
        "title": "Chess",
        "desc": "A multiplayer Chess game built using React and Socket.io. A user enters a game room name, and after connecting the server they are prompted with a screen telling them to share the game room name to another player. When both players connect to the same room, the game starts. The server is hosted separately from the client.",
        "tools": `
            <i class="fab fa-react"></i> React,
            Styled Components,
            Socket.io`,
        
        "link": "https://hungry-franklin-438ea6.netlify.app/",
        "image": "project_thumb_chess.png"
    }, 
    {
        "title": "Currency Exchanger",
        "desc": "A currency exchanger, utilizing a free API to find conversion rates. This was my first time developing something meant for my portfolio and my first time using Styled Components.",
        "tools": `
        <i class="fab fa-react"></i> React,
        Styled Components`,

        "link": "https://jespergustafsson.github.io/currency-exchanger-v2/",
        "image": "project_thumb_currency.png"
    },
    {
        "title": "Anonymous Chat",
        "desc": "An anonymous chat, using Firebase (NoSQL style database) to store messages and handle authorization.",
        "tools": `
        <i class="fab fa-react"></i> React,
        Styled Components,
        Firebase`,

        "link": "https://jespergustafsson.github.io/chat-app/",
        "image": "project_thumb_chat.png"

    },
    {
        "title": "TripToken",
        "desc": "A transportation application. Traffic, users and bills are stored and accessed via a PostgreSQL database. Includes a simulator page that simulates traffic, altering the database with CRUD operations. I used the bcrypt library to salt and hash passwords before storing.",
        "tools": `
        <i class="fab fa-react"></i> React,
        Styled Components,
        PostgreSQL`,
        
        "link": "https://powerful-meadow-92316.herokuapp.com/",
        "image": "project_thumb_triptoken.png"

    }
];