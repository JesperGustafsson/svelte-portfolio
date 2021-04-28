<script>
	import Navbar from './components/Navbar.svelte'
    import Header from './components/Header.svelte'
    import About from './components/About.svelte'
    import Portfolio from './components/Portfolio.svelte' 
</script>

<svelte:head>
    <script src="https://kit.fontawesome.com/4b80321256.js" crossorigin="anonymous"></script>
    <link rel='stylesheet' href='src\global.css'>
</svelte:head>

<body>
	<Navbar />
    <Header />
    <About />
    <Portfolio /> 
</body>