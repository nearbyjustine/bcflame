# Text Effect Shadow - Bubbly
# We can still change the colors here (not green)

$green-bg: lighten(OliveDrab, 15%);
$green: darken(OliveDrab, 15%);

html {
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
  &:focus {
    outline: none;
  }
}

body {
  margin: 0;
  padding: 0;
  background: $green-bg;
}

.wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.text {
  position: relative;
  margin: 0;
  padding: 0;
  // font-family: "cubano-sharp", monaco, courier;
  font-family: "cubano", monaco, courier;
  font-size: var(--font-size);
  font-weight: 400;
  text-align: center;
  font-style: normal;
  color: aquamarine;
  text-shadow: -1px 0 $green, 0 1px $green, 1px 0 $green, 0 -1px $green, -8px 8px $green, -7px 7px $green, -6px 6px $green, -5px 5px $green, -4px 4px $green, -3px 3px $green, -2px 2px $green, -1px 1px $green;
}

.side {
  transform: rotate(-90deg);
  align-self: center;
}

.t1 {
  font-size: 120px;
  .dash {
    position: relative;
    left: -6px;
    display: none;
    @media (min-width: 768px) {
      display: inline;
    }
  }
  .nine {
    position: relative;
    top: -50px;
    display: block;
    font-size: 192px;;
    @media (min-width: 768px) {
      top: 0;
      display: inline;
      font-size: inherit;
    }
  }
}

.row {
  position: relative;
  top: -30px;
  left: -20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: space-between;
  line-height: 0.75;
  @media (min-width: 768px) {
    top: 0;
    flex-direction: row;
  }
}

.t2 {
  top: 64px;
  left: -128px;
  font-size: 170px;
  @media (min-width: 768px) {
    top: 0;
    left: -10px;
    font-size: 80px;
  }
}

.t3 {
  top: -180px;
  font-size: 200px;
  @media (min-width: 768px) {
    top: -10px;
  }
  .word-a {
    position: relative;
    left: 112px;
    font-size: 420px;
    @media (min-width: 768px) {
      left: 0;
      font-size: inherit;
    }
  }
  .half {
    position: relative;
    top: 30px;
    left: 22px;
    display: block;
    font-size: 174px;
    @media (min-width: 768px) {
      top: 0;
      left: 0;
      display: inline;
      font-size: inherit;
    }
  }
}

.t4 {
  top: -185px;
  font-size: 135px;
  @media (min-width: 768px) {
    top: -20px;
    font-size: 165px;
  }
  .wont {
    display: block;
    @media (min-width: 768px) {
      display: inline;
    }
  }
  .do {
    position: relative;
    top: -100px;
    left: 10px;
    font-size: 350px;
    @media (min-width: 768px) {
      top: 0;
      left: 0;
      font-size: inherit;
    }
  }
}


---

# Colorfun Line Text Effect

main {
  transition: all 0.5s;
  -webkit-text-stroke: 4px #d6f4f4;
  font-variation-settings: "wght" 900, "ital" 1;
  font-size: 15rem;
  text-align: center;
  color: transparent;
  font-family: "Meta", sans-serif;
  text-shadow: 10px 10px 0px #07bccc,
    15px 15px 0px #e601c0,
    20px 20px 0px #e9019a,
    25px 25px 0px #f40468,
    45px 45px 10px #482896;
  cursor: pointer;
}

----


# Sweet Stuff
@import url("https://fonts.googleapis.com/css2?family=Exo+2:wght@300;700;900&display=swap");

body {
  font-family: "Exo 2", sans-serif;
  background: rgb(63, 161, 251);
  background: linear-gradient(
    142deg,
    rgba(63, 161, 251, 1) 0%,
    rgba(252, 70, 168, 1) 100%
  );
}

.header {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 4rem);
}

.title-wrapper {
  display: grid;
  align-items: center;
  justify-content: center;
  transform: skew(0, -10deg);
}

.top-title {
  order: 1;
  text-align: center;
  display: block;
  color: #fff;
  font-size: clamp(1rem, 4vw, 1.5rem);
  margin-bottom: 1rem;
  padding-right: 2rem;
}

.bottom-title {
  order: 3;
  text-align: center;
  display: block;
  color: #fff;
  font-size: clamp(1rem, 4vw, 1.5rem);
  margin-top: 2rem;
  padding-left: 2rem;
}

.sweet-title {
  order: 2;
  color: #fde9ff;
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(3rem, 10vw, 6rem);
  line-height: 0.75em;
  text-align: center;
  text-shadow: 3px 1px 1px #4af7ff, 2px 2px 1px #165bfb, 4px 2px 1px #4af7ff,
    3px 3px 1px #165bfb, 5px 3px 1px #4af7ff, 4px 4px 1px #165bfb,
    6px 4px 1px #4af7ff, 5px 5px 1px #165bfb, 7px 5px 1px #4af7ff,
    6px 6px 1px #165bfb, 8px 6px 1px #4af7ff, 7px 7px 1px #165bfb,
    9px 7px 1px #4af7ff;

  span {
    display: block;
    position: relative;

    &:before {
      content: attr(data-text);
      position: absolute;
      text-shadow: 2px 2px 1px #e94aa1, -1px -1px 1px #c736f9,
        -2px 2px 1px #e94aa1, 1px -1px 1px #f736f9;
      z-index: 1;
    }

    &:nth-child(1) {
      padding-right: 2.25rem;
    }

    &:nth-child(2) {
      padding-left: 2.25rem;
    }
  }
}

.disclaimer {
  width: 100%;
  height: 2rem;
  text-align: center;
  color: #fff;

  a {
    color: #fff;
  }
}


----

# Color Fonts

@font-face {
  font-family: 'Rocher';
  src: url(https://assets.codepen.io/9632/RocherColorGX.woff2);
}

body {
  font-family: 'Rocher';
  text-align: center;
  font-size: 50px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  margin: 0;
}

@font-palette-values --Grays {
  font-family: Rocher;
  base-palette: 9;
}

@font-palette-values --Purples {
  font-family: Rocher;
  base-palette: 6;
}

@font-palette-values --Mint {
  font-family: Rocher;
  base-palette: 7;
}

.grays {
  font-palette: --Grays;
}

.purples {
  font-palette: --Purples;
}

.mint {
  font-palette: --Mint;
}

---

# Retro Text Effect

@import url('https://fonts.googleapis.com/css2?family=Mr+Dafoe&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Exo:wght@900&display=swap');

body, html {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: radial-gradient(rgba(#7600bf, 0.5) 0%, transparent 70%), linear-gradient(#0b161e 40%, #202076 70%);
  perspective: 700px;
  font-size: clamp(10px, 2vw, 20px);
}

.lines {
  $color: #59c1fe;
  position: fixed;
  width: 100vw;
  height: 4em;
  background: linear-gradient(rgba($color, 0.2) 20%, $color 40%, $color 60%, rgba($color, 0.2) 80%);
  background-size: 1px 0.5em;
  box-shadow: 0 0 1em rgba($color, 0.4);
  transform: translateY(-1em);
  left: 0;
}

h1 {
  position: relative;
  font-family: 'Exo';
  font-size: 9em;
  margin: 0;
  transform: skew(-15deg);
  letter-spacing: 0.03em;
  
  &::after {
    content: '';
    position: absolute;
    top: -0.1em;
    right: 0.05em;
    width: 0.4em;
    height: 0.4em;
    background: 
      radial-gradient(white 3%, rgba(white, 0.3) 15%, rgba(white, 0.05) 60%, transparent 80%),
      radial-gradient(rgba(white, 0.2) 50%, transparent 60%) 50% 50% / 5% 100%,
      radial-gradient(rgba(white, 0.2) 50%, transparent 60%) 50% 50% / 70% 5%;
    background-repeat: no-repeat;
  }
  
  span:first-child {
    display: block;
    text-shadow: 0 0 0.1em #8ba2d0, 0 0 0.2em black,  0 0 5em #165ff3;
    -webkit-text-stroke: 0.06em rgba(black, 0.5);
  }
  
  span:last-child {
    position: absolute;
    left: 0;
    top: 0;
    background-image: linear-gradient(#032d50 25%, #00a1ef 35%, white 50%, #20125f 50%, #8313e7 55%, #ff61af 75%);
    -webkit-text-stroke: 0.01em #94a0b9;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

h2 {
  font-family: 'Mr Dafoe';
  margin: 0;
  font-size: 5.5em;
  margin-top: -0.6em;
  color: white;
  text-shadow: 0 0 0.05em #fff, 0 0 0.2em #fe05e1, 0 0 0.3em #fe05e1;
  transform: rotate(-7deg);
}

.grid {
  $main: #7d41e6;
  $glow: rgba(#2e26ff, 0.4);
  background: 
    linear-gradient(transparent 65%, $glow 75%, $main 80%, $glow 85%, transparent 95%),
    linear-gradient(90deg, transparent 65%, $glow 75%, $main 80%, $glow 85%, transparent 95%);
  background-size: 30px 30px;
  width: 200vw;
  height: 300vh;
  position: absolute;
  bottom: -120vh;
  transform: rotateX(-100deg);
  -webkit-mask-image: linear-gradient(rgba(0,0,0,1), rgba(0,0,0,0) 80%);
}
