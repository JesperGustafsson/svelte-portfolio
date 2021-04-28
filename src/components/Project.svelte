<script>
    export let bgColor
    export let title
    export let desc
    export let link
    export let tools
    export let imgSource
</script>
<style type="text/scss">
    main {
        width: 100%;
        display: flex;  
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    content {
        max-width: 1280px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .image {
        width: 33%;
    }

    .text {
        width: 66%;
        padding: 0em 2em;
    }
    img {
        width: 100%;
        border: 1px solid black;
        box-shadow: black 0.25em 0em 0.5em;
        display: block;
        transition: 200ms;

        &:hover {
            transform: scale(1.1);
            box-shadow: black 0.5em 0em 1.5em;
        }
    }

    p, h2 {
        color: white;
        padding: 0em;
    }

    p {
        margin-top: 3em;
    }

</style>


<main style="background: {bgColor}">
    <content>

    <div class ="image">
        <a href = {link}><img src={imgSource} alt='chess project'></a>
    </div>
    <div class ="text">
        <h1>{title}</h1>
        <h2>{@html tools}</h2>
        <p>{desc}</p>
    </div>
    </content>

</main>