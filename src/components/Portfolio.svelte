<script>
    import Project from "./Project.svelte";
    import { projects } from "./projects.ts";
</script>


<style type="text/scss">
    main {
        background: #151515;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    p {
        margin-bottom: 4em;
        max-width: 1280px;
    }
    h1 {
        margin-top: 4em;
    }
</style>

<main id="portfolio">
    <h1>My Portfolio</h1>
    <p>Most of my projects are built using React. This portfolio itself, however, is my first time experimenting with Svelte.</p>
    {#each projects as project, i}
        {#if i % 2}

        <Project title={project.title} desc={project.desc} bgColor='#2f2f2f' 
        link = {project.link} tools={project.tools} imgSource = {project.image}/>

        {:else}
        <Project title={project.title} desc={project.desc}
        link = {project.link} tools={project.tools} imgSource = {project.image}/>
        {/if}
    {/each}
</main>