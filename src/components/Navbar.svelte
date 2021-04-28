<nav>
    <a class ='link' href="/">Home</a>
    <div>
        <a class ='link'  href="#about">About</a>
        <a class ='link'  href="#portfolio">Portfolio</a>
        <a class ='link'  href="/">Contact</a>
    </div>
</nav>


<style type="text/scss">
    a {
        color: #dadada;
        font-size: 32px;
        padding: 0em 2em;
        
        &:hover {
            color: white;
        }
    }

    
    nav {
        padding: 1em 0em;
        position: fixed;
        background: #111111;
        display: flex;
        justify-content: space-around;
        box-shadow: black 0em 2px 5px;
        width: 100%;
        z-index: 1;
    }
</style>