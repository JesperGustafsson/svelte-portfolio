<main id="about">
    <content>
        <div class='image'>
            <img src='portfolioPhoto.jpg' alt='me' />
        </div> 
        <div class='text'>
            <h1>About me</h1>
            <hr>
            <p>I studied Computer Science at Lund University, Sweden (2014 - 2017). Afterwards, I decided to study Japanese, also at Lund Univeristy (2017 - 2020), partly because I wanted to come into contact with a wide variety of people and their ideas/perspectives, rather than spend most of my young adulthood with mostly coders. After coming back to Sweden from my exchange year, I started dabbling in front-end development as it was something my education lacked. I would ideally want to work towards building a sustainable future or help people in need.</p>
        </div>
    </content>
</main>


<style type="text/scss">
    main {
        display: flex;
        justify-content: center;
    }

    content {
        display: flex;
        align-items: center;
        height: 100vh;
        width: 1280px;

        .image {
            img {
                width: 100%;
                max-height: 500px;
            }
        }
        .text {
            display: flex;
            flex-direction: column;
            align-items: center;
            
            width: 80%;
            padding: 0em 2em 0em 4em;
        }
    }

    hr {
        width: 50px;
        margin: -12px 0 16px 0;

    }
</style>
    