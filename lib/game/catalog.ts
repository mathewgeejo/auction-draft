import type {
  ChallengeDefinition,
  ComponentItem,
  ComponentType,
  Rarity,
  ScoringCriterion,
} from "./types";

type ItemInput = [name: string, description: string, tags: string[], rarity?: Rarity];

const scoreFor = (rarity: Rarity) =>
  ({ common: 5, standout: 8, legendary: 11 })[rarity];

const makeItems = (
  challengeId: string,
  componentType: string,
  values: ItemInput[],
): ComponentItem[] =>
  values.map(([name, description, tags, rarity = "common"]) => ({
    id: `${challengeId}-${componentType}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    componentType,
    description,
    imageSearchTerm: name,
    tags,
    rarity,
    score: scoreFor(rarity),
  }));

const type = (
  id: string,
  name: string,
  description: string,
  required = true,
  maxSelections = 1,
): ComponentType => ({ id, name, description, required, maxSelections });

const foodCriteria: ScoringCriterion[] = [
  { name: "Flavor balance", description: "How harmoniously the parts work together.", weight: 1 },
  { name: "Ingredient synergy", description: "Complementary flavor and texture choices.", weight: 1 },
  { name: "Creativity", description: "A distinct point of view, not just safe choices.", weight: 1 },
  { name: "Variety", description: "A satisfying mix of component roles.", weight: 1 },
  { name: "Overall appeal", description: "The game’s playful estimate of desirability.", weight: 1 },
];

const experienceCriteria: ScoringCriterion[] = [
  { name: "Atmosphere", description: "How memorable the mood feels.", weight: 1 },
  { name: "Entertainment", description: "Strength of activities and moments.", weight: 1 },
  { name: "Variety", description: "Range without losing the central idea.", weight: 1 },
  { name: "Creativity", description: "An unexpected, cohesive identity.", weight: 1 },
  { name: "Overall experience", description: "The game’s playful estimate of the payoff.", weight: 1 },
];

const burgerTypes = [
  type("bun", "Bun", "The foundation that holds the build together."),
  type("patty", "Patty", "The main event: choose your signature protein."),
  type("cheese", "Cheese", "Creaminess, melt and sharpness."),
  type("sauce", "Sauce", "The connective flavor."),
  type("topping", "Toppings", "Texture and contrast.", false, 2),
];

const loadedFriesTypes = [
  type("fries", "Fries", "Your foundational fry cut."),
  type("protein", "Protein", "The savory anchor."),
  type("cheese", "Cheese", "The melty element."),
  type("sauce", "Sauce", "The finishing pour."),
  type("topping", "Toppings", "Crunch, heat, and freshness.", false, 2),
];

const cakeTypes = [
  type("base", "Cake base", "The cake’s core flavor and crumb."),
  type("layer", "Layer", "A rich middle layer."),
  type("frosting", "Frosting", "The exterior finish."),
  type("filling", "Filling", "Fruit, crunch, or a hidden surprise."),
  type("decoration", "Decoration", "The final visual flourish.", false, 2),
];

const chocolateTypes = [
  type("base", "Chocolate base", "The character of the bar."),
  type("flavor", "Flavor", "The leading flavor direction."),
  type("filling", "Filling", "The centre-piece bite."),
  type("texture", "Texture", "Contrast and crunch."),
  type("special", "Special finish", "An optional signature move.", false, 1),
];

const friedChickenTypes = [
  type("chicken", "Chicken style", "The star of the basket."),
  type("crust", "Crust", "The crunch and seasoning approach."),
  type("sauce", "Sauce", "The defining flavor route."),
  type("side", "Side", "A companion worth fighting for."),
  type("finish", "Finish", "A final extra.", false, 1),
];

const waterParkTypes = [
  type("signature", "Signature slide", "The headline attraction."),
  type("family", "Family attraction", "Big fun for all ages."),
  type("thrill", "Thrill attraction", "Adrenaline on demand."),
  type("relaxation", "Relaxation", "A place to slow down."),
  type("food", "Food & drink", "Fuel worth planning around."),
  type("unique", "Unique feature", "The reason guests tell friends.", false, 1),
];

const halloweenTypes = [
  type("decor", "Decorations", "The scene-setters."),
  type("activity", "Activities", "Things that make the night happen."),
  type("food", "Food & drink", "Seasonal treats and sips."),
  type("entertainment", "Entertainment", "The evening’s featured fun."),
  type("atmosphere", "Atmosphere", "The feeling everyone remembers."),
];

const onamTypes = [
  type("sadhya", "Sadhya", "The celebratory meal’s centre."),
  type("dish", "Traditional dish", "A meaningful table addition."),
  type("culture", "Culture", "A living traditional expression."),
  type("experience", "Experience", "A shared celebration moment."),
  type("music", "Atmosphere", "The festive finishing layer.", false, 1),
];

const christmasTypes = [
  type("decor", "Decoration", "The visual welcome."),
  type("food", "Food & drink", "Comfort on the table."),
  type("experience", "Experience", "A tradition to share."),
  type("atmosphere", "Atmosphere", "The season’s feeling."),
  type("wildcard", "Wildcard", "One extravagant bonus.", false, 1),
];

const challenges: ChallengeDefinition[] = [
  {
    id: "burger",
    name: "Best Burger",
    kicker: "Kitchen showdown",
    description: "Spend wisely to assemble the burger everyone talks about.",
    objective: "Build a burger with a confident core and a little surprise.",
    imageSearchTerm: "gourmet burger",
    accent: "#ff6b2c",
    componentTypes: burgerTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: foodCriteria,
    items: [
      ...makeItems("burger", "bun", [
        ["Brioche bun", "Buttery, golden and made for a serious stack.", ["rich", "classic"], "standout"],
        ["Pretzel bun", "Dark, salty and sturdy.", ["salty", "bold"], "standout"],
        ["Potato bun", "Soft, pillowy and unfussy.", ["soft", "classic"]],
        ["Garlic butter bun", "A fragrant, decadent foundation.", ["rich", "garlic"], "legendary"],
      ]),
      ...makeItems("burger", "patty", [
        ["Smash beef", "Lacy-edged beef with a hard sear.", ["beef", "classic", "savory"], "legendary"],
        ["Crispy chicken", "Crackling fried chicken with a juicy centre.", ["chicken", "crunch", "savory"], "standout"],
        ["Paneer patty", "Spiced paneer with a charred edge.", ["vegetarian", "spiced", "savory"], "standout"],
        ["Lamb patty", "Deep, peppery lamb.", ["bold", "savory", "rich"], "legendary"],
      ]),
      ...makeItems("burger", "cheese", [
        ["Smoked cheddar", "Sharp cheddar with a smoky finish.", ["smoky", "rich", "savory"], "standout"],
        ["Pepper jack", "Creamy cheese with a bright heat.", ["spiced", "creamy", "bold"], "standout"],
        ["American cheese", "The classic melting layer.", ["classic", "creamy", "savory"]],
        ["Blue cheese", "Funky, bold and divisive in the best way.", ["bold", "rich", "savory"], "legendary"],
      ]),
      ...makeItems("burger", "sauce", [
        ["Truffle mayo", "Earthy, creamy and extravagant.", ["rich", "creamy", "earthy"], "legendary"],
        ["Chipotle sauce", "Smoky heat with a slow burn.", ["smoky", "spiced", "bold"], "standout"],
        ["Burger sauce", "Tangy, creamy and familiar.", ["classic", "creamy", "tangy"]],
        ["Honey mustard", "Sweet, sharp and bright.", ["sweet", "tangy", "classic"]],
      ]),
      ...makeItems("burger", "topping", [
        ["Caramelized onions", "Jammy sweetness and deep savor.", ["sweet", "rich", "savory"], "standout"],
        ["Crispy onions", "A delicate fried crunch.", ["crunch", "savory", "classic"]],
        ["Pickles", "Cold acidity that cuts through richness.", ["tangy", "classic", "fresh"]],
        ["Fried egg", "A golden, runny wildcard.", ["rich", "savory", "bold"], "legendary"],
      ]),
    ],
  },
  {
    id: "loaded-fries",
    name: "Best Loaded Fries",
    kicker: "Late-night legend",
    description: "Build the perfect balance of crunch, sauce, heat and comfort.",
    objective: "Make a loaded fries plate that stays coherent until the final bite.",
    imageSearchTerm: "loaded fries",
    accent: "#e99b16",
    componentTypes: loadedFriesTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: foodCriteria,
    items: [
      ...makeItems("loaded-fries", "fries", [
        ["Cajun fries", "Seasoned fries with a smoky pepper kick.", ["spiced", "crisp", "bold"], "standout"],
        ["Waffle fries", "Deep pockets built to hold sauce.", ["crisp", "classic", "comfort"], "standout"],
        ["Garlic parmesan fries", "Savory, fragrant and dramatic.", ["garlic", "rich", "savory"], "legendary"],
        ["Curly fries", "Playful, crunchy curls.", ["crisp", "classic", "comfort"]],
      ]),
      ...makeItems("loaded-fries", "protein", [
        ["Popcorn chicken", "Crisp little bites in every forkful.", ["chicken", "crunch", "comfort"], "standout"],
        ["Pulled beef", "Slow cooked, tender and savory.", ["beef", "rich", "savory"], "legendary"],
        ["Shawarma chicken", "Warm spices and charred edges.", ["chicken", "spiced", "savory"], "standout"],
        ["Smoked bacon", "Salty, smoky crunch.", ["smoky", "salty", "rich"], "legendary"],
      ]),
      ...makeItems("loaded-fries", "cheese", [
        ["Nacho cheese", "Silky, unapologetic cheese sauce.", ["creamy", "comfort", "savory"]],
        ["Smoked gouda", "A melting layer with real depth.", ["smoky", "rich", "savory"], "standout"],
        ["Mozzarella pull", "Mild, stretchy drama.", ["creamy", "classic", "comfort"]],
        ["Pepper jack", "Cheese with a jalapeño spark.", ["spiced", "creamy", "bold"], "standout"],
      ]),
      ...makeItems("loaded-fries", "sauce", [
        ["Truffle sauce", "A silky, aromatic splurge.", ["earthy", "rich", "creamy"], "legendary"],
        ["Sriracha mayo", "Creamy chilli heat.", ["spiced", "creamy", "bold"], "standout"],
        ["Ranch", "Cooling, herbal comfort.", ["creamy", "fresh", "comfort"]],
        ["Chipotle BBQ", "Sweet smoke and a warm sting.", ["smoky", "sweet", "bold"], "standout"],
      ]),
      ...makeItems("loaded-fries", "topping", [
        ["Pickled jalapeños", "Acid, heat and freshness.", ["spiced", "tangy", "fresh"], "standout"],
        ["Crispy onions", "A shattering salty crown.", ["crunch", "savory", "classic"]],
        ["Mac and cheese", "A messy, maximalist topping.", ["comfort", "creamy", "rich"], "legendary"],
        ["Corn salsa", "Sweet pops with a bright finish.", ["fresh", "sweet", "tangy"]],
      ]),
    ],
  },
  {
    id: "cake",
    name: "Best Cake",
    kicker: "Patisserie pressure",
    description: "Bid blind for a cake with drama in every layer.",
    objective: "Create a cake with a clear flavor story and visual finish.",
    imageSearchTerm: "layer cake",
    accent: "#e54d83",
    componentTypes: cakeTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: foodCriteria,
    items: [
      ...makeItems("cake", "base", [
        ["Pistachio sponge", "Nutty green crumb with an elegant edge.", ["pistachio", "nutty", "rich"], "legendary"],
        ["Red velvet sponge", "Cocoa-kissed and theatrical.", ["chocolate", "classic", "rich"], "standout"],
        ["Lemon sponge", "Bright and fragrant.", ["citrus", "fresh", "light"], "standout"],
        ["Chocolate sponge", "Deep cocoa and crowd-pleasing comfort.", ["chocolate", "rich", "classic"]],
      ]),
      ...makeItems("cake", "layer", [
        ["Lotus Biscoff layer", "Spiced biscuit cream with crunch.", ["caramel", "spiced", "crunch"], "legendary"],
        ["Salted caramel layer", "Buttery sweetness with a balancing salt.", ["caramel", "salty", "rich"], "standout"],
        ["Pistachio cream layer", "Silky nutty luxury.", ["pistachio", "nutty", "creamy"], "legendary"],
        ["Strawberry compote", "Jammy fruit brightness.", ["berry", "fresh", "sweet"], "standout"],
      ]),
      ...makeItems("cake", "frosting", [
        ["Swiss meringue", "Airy, sleek and less sweet.", ["light", "creamy", "classic"], "standout"],
        ["Chocolate ganache", "Glossy, intense and luxurious.", ["chocolate", "rich", "creamy"], "legendary"],
        ["Mascarpone cream", "Soft tang and sophisticated richness.", ["creamy", "rich", "light"], "standout"],
        ["Cream cheese frosting", "Tangy classic comfort.", ["tangy", "creamy", "classic"]],
      ]),
      ...makeItems("cake", "filling", [
        ["Raspberry filling", "Tart berry burst.", ["berry", "tangy", "fresh"], "standout"],
        ["Passion fruit curd", "Tropical tartness.", ["tropical", "tangy", "fresh"], "legendary"],
        ["Nutella filling", "Hazelnut chocolate indulgence.", ["chocolate", "nutty", "rich"], "standout"],
        ["Mango filling", "Sunny fruit sweetness.", ["tropical", "fresh", "sweet"]],
      ]),
      ...makeItems("cake", "decoration", [
        ["Fresh berries", "A jewel-like crown.", ["berry", "fresh", "elegant"], "standout"],
        ["Gold leaf", "A tiny flash of luxury.", ["elegant", "bold", "rich"], "legendary"],
        ["Caramel drip", "A glossy, generous cascade.", ["caramel", "rich", "dramatic"], "standout"],
        ["Chocolate shards", "Height, crunch and cocoa drama.", ["chocolate", "crunch", "dramatic"]],
      ]),
    ],
  },
  {
    id: "chocolate",
    name: "Best Chocolate Bar",
    kicker: "Confectionery clash",
    description: "Make every snap, filling and finish count.",
    objective: "Create a bar with depth, texture and an irresistible final bite.",
    imageSearchTerm: "artisan chocolate bar",
    accent: "#8d4d39",
    componentTypes: chocolateTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: foodCriteria,
    items: [
      ...makeItems("chocolate", "base", [
        ["Dark chocolate 70%", "Bittersweet cocoa with serious depth.", ["chocolate", "bold", "rich"], "standout"],
        ["Ruby chocolate", "Naturally pink, fruity and unexpected.", ["berry", "tangy", "bold"], "legendary"],
        ["Milk chocolate", "Creamy and nostalgic.", ["chocolate", "creamy", "classic"]],
        ["White chocolate", "Sweet, buttery and blank-canvas versatile.", ["creamy", "sweet", "classic"]],
      ]),
      ...makeItems("chocolate", "flavor", [
        ["Pistachio", "Buttery roasted green nuts.", ["pistachio", "nutty", "rich"], "legendary"],
        ["Espresso", "Roasted coffee intensity.", ["coffee", "bold", "rich"], "standout"],
        ["Orange zest", "Bright citrus lift.", ["citrus", "fresh", "tangy"], "standout"],
        ["Sea salt caramel", "Sweetness sharpened by salt.", ["caramel", "salty", "rich"]],
      ]),
      ...makeItems("chocolate", "filling", [
        ["Hazelnut praline", "Silky nut paste with crunch.", ["nutty", "chocolate", "rich"], "legendary"],
        ["Cookie butter", "Spiced biscuit cream.", ["spiced", "caramel", "creamy"], "standout"],
        ["Salted caramel", "Flowing golden centre.", ["caramel", "salty", "rich"], "standout"],
        ["Raspberry ganache", "Fruit-forward chocolate cream.", ["berry", "chocolate", "tangy"]],
      ]),
      ...makeItems("chocolate", "texture", [
        ["Feuilletine", "Fine, buttery flakes for a delicate crackle.", ["crunch", "buttery", "light"], "standout"],
        ["Roasted almonds", "Nutty crunch and warmth.", ["nutty", "crunch", "rich"]],
        ["Cookie pieces", "Nostalgic, irregular crunch.", ["crunch", "comfort", "sweet"]],
        ["Puffed rice", "Light, airy crispness.", ["crunch", "light", "classic"]],
      ]),
      ...makeItems("chocolate", "special", [
        ["Freeze-dried raspberry", "A bright pink, tart finish.", ["berry", "tangy", "dramatic"], "standout"],
        ["Gold leaf", "A precise flourish of theatre.", ["elegant", "bold", "rich"], "legendary"],
        ["Chilli sparkle", "A warm surprise after the sweetness.", ["spiced", "bold", "dramatic"], "standout"],
        ["Espresso dust", "A dark roasted final note.", ["coffee", "bold", "rich"]],
      ]),
    ],
  },
  {
    id: "fried-chicken",
    name: "Best Fried Chicken",
    kicker: "Crunch championship",
    description: "Build a basket with a signature crunch and supporting cast.",
    objective: "Balance juicy chicken, a great crust and sauce people remember.",
    imageSearchTerm: "crispy fried chicken",
    accent: "#c53d23",
    componentTypes: friedChickenTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: foodCriteria,
    items: [
      ...makeItems("fried-chicken", "chicken", [
        ["Buttermilk thigh", "Dark meat soaked for tenderness.", ["juicy", "classic", "comfort"], "standout"],
        ["Korean fried chicken", "Double-fried for an extraordinary crackle.", ["crunch", "spiced", "bold"], "legendary"],
        ["Nashville hot chicken", "Fiery, tender and fearless.", ["spiced", "bold", "juicy"], "legendary"],
        ["Boneless chicken bites", "A crowd-friendly basket staple.", ["chicken", "comfort", "classic"]],
      ]),
      ...makeItems("fried-chicken", "crust", [
        ["Cornflake crust", "Big crunch and sunny color.", ["crunch", "classic", "comfort"], "standout"],
        ["Peppery flour crust", "Old-school crackle with a pepper bite.", ["crunch", "spiced", "classic"]],
        ["Panko crust", "Airy, shattering crispness.", ["crunch", "light", "savory"], "standout"],
        ["Cajun spice crust", "Toasted spices in every bite.", ["spiced", "bold", "crunch"], "legendary"],
      ]),
      ...makeItems("fried-chicken", "sauce", [
        ["Hot honey", "Sticky sweetness with a chilli glow.", ["sweet", "spiced", "bold"], "standout"],
        ["Gochujang glaze", "Fermented chilli depth and shine.", ["spiced", "sweet", "savory"], "legendary"],
        ["Garlic parmesan", "Rich, savory and fragrant.", ["garlic", "rich", "savory"], "standout"],
        ["Smoky BBQ", "Slow-cooked sweetness and smoke.", ["smoky", "sweet", "classic"]],
      ]),
      ...makeItems("fried-chicken", "side", [
        ["Truffle fries", "Crisp, fragrant and a little excessive.", ["earthy", "crisp", "rich"], "legendary"],
        ["Creamy slaw", "Cold crunch to cut through the heat.", ["fresh", "creamy", "tangy"], "standout"],
        ["Cheddar mac", "A golden comfort classic.", ["comfort", "creamy", "rich"]],
        ["Cornbread", "Sweet, buttery and warm.", ["sweet", "buttery", "comfort"]],
      ]),
      ...makeItems("fried-chicken", "finish", [
        ["Dill pickles", "Sharp, cold and essential.", ["tangy", "fresh", "classic"]],
        ["Fried egg", "A runny, late-night wildcard.", ["rich", "bold", "savory"], "legendary"],
        ["Scallion confetti", "Green freshness and color.", ["fresh", "light", "savory"]],
        ["Maple drizzle", "Sweet lacquer with a dramatic shine.", ["sweet", "rich", "dramatic"], "standout"],
      ]),
    ],
  },
  {
    id: "water-park",
    name: "Best Water Park",
    kicker: "Resort rivalries",
    description: "Design a park that thrills, restores and keeps every guest happy.",
    objective: "Build a destination with one unforgettable reason to visit.",
    imageSearchTerm: "modern water park",
    accent: "#1e93b8",
    componentTypes: waterParkTypes,
    numberOfItemsRequired: 9,
    scoringCriteria: [
      { name: "Thrill", description: "Big-ticket adrenaline and spectacle.", weight: 1 },
      { name: "Family appeal", description: "How well every age is welcomed.", weight: 1 },
      { name: "Variety", description: "Range of ways to spend a full day.", weight: 1 },
      { name: "Relaxation", description: "Space to recover and linger.", weight: 1 },
      { name: "Uniqueness", description: "A reason it could not be anywhere else.", weight: 1 },
    ],
    items: [
      ...makeItems("water-park", "signature", [
        ["Giant water coaster", "A launch-powered aquatic roller coaster.", ["thrill", "signature", "speed"], "legendary"],
        ["Trapdoor slide", "The floor vanishes before a vertical drop.", ["thrill", "speed", "dramatic"], "legendary"],
        ["Tornado slide", "A huge funnel with chaotic banked turns.", ["thrill", "family", "signature"], "standout"],
        ["Multi-lane racer", "Competitive mat racing for a cheering crowd.", ["thrill", "family", "speed"], "standout"],
      ]),
      ...makeItems("water-park", "family", [
        ["Wave pool", "A beach day with timed ocean swells.", ["family", "relax", "classic"], "standout"],
        ["Family raft ride", "Shared drops and turns in a giant raft.", ["family", "thrill", "shared"], "standout"],
        ["Interactive water playground", "Climbs, cannons and surprise soak zones.", ["family", "kids", "play"], "legendary"],
        ["Lazy river", "A shaded loop through the whole park.", ["family", "relax", "classic"]],
      ]),
      ...makeItems("water-park", "thrill", [
        ["Boomerang slide", "A gravity-defying wall sends riders skyward.", ["thrill", "speed", "dramatic"], "legendary"],
        ["High-speed mat racer", "Face-first racing with a photo finish.", ["thrill", "speed", "family"], "standout"],
        ["Giant funnel", "Rafts spin into a massive open bowl.", ["thrill", "signature", "shared"], "standout"],
        ["Looping slide", "A transparent loop for real daredevils.", ["thrill", "speed", "bold"], "legendary"],
      ]),
      ...makeItems("water-park", "relaxation", [
        ["Luxury cabanas", "Private shade, daybeds and dedicated service.", ["relax", "luxury", "family"], "standout"],
        ["Infinity pool", "A quiet horizon-facing soak.", ["relax", "luxury", "scenic"], "legendary"],
        ["Adults-only pool", "A calm zone far from the splash.", ["relax", "luxury", "quiet"], "standout"],
        ["Swim-up bar", "Tropical drinks without leaving the water.", ["relax", "social", "tropical"]],
      ]),
      ...makeItems("water-park", "food", [
        ["Tropical drinks bar", "Fresh fruit coolers and frozen treats.", ["tropical", "relax", "social"], "standout"],
        ["Gourmet burger deck", "A proper lunch with a view of the slides.", ["comfort", "family", "social"], "standout"],
        ["Loaded fries stand", "A hot, shareable reward after the rides.", ["comfort", "family", "shared"]],
        ["Ice cream lab", "Custom scoops and wild toppings.", ["family", "sweet", "play"]],
      ]),
      ...makeItems("water-park", "unique", [
        ["Surf simulator", "All-day artificial waves for beginners and pros.", ["thrill", "signature", "tropical"], "legendary"],
        ["Night slides", "After-dark rides under a light show.", ["thrill", "dramatic", "signature"], "legendary"],
        ["Underwater tunnel", "A walk-through world beneath the pools.", ["family", "scenic", "unique"], "standout"],
        ["Volcano attraction", "A towering water-feature centrepiece.", ["family", "dramatic", "signature"], "standout"],
      ]),
    ],
  },
  {
    id: "halloween",
    name: "Best Halloween",
    kicker: "After-dark auction",
    description: "Create a night with just the right amount of fright.",
    objective: "Build the ultimate Halloween experience, not just a pile of props.",
    imageSearchTerm: "Halloween party decorations",
    accent: "#9a4bc3",
    componentTypes: halloweenTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: experienceCriteria,
    items: [
      ...makeItems("halloween", "decor", [
        ["Pumpkin carving gallery", "A glowing lineup of hand-carved faces.", ["classic", "creative", "warm"], "standout"],
        ["Haunted house facade", "A cinematic entrance with secrets inside.", ["scary", "dramatic", "signature"], "legendary"],
        ["Giant spider web", "An oversized front-yard statement.", ["scary", "dramatic", "classic"]],
        ["Candlelit path", "A flickering route into the night.", ["warm", "atmosphere", "classic"], "standout"],
      ]),
      ...makeItems("halloween", "activity", [
        ["Costume contest", "A high-stakes parade of imagination.", ["creative", "social", "classic"], "standout"],
        ["Trick-or-treat trail", "A mapped route with surprise stops.", ["family", "social", "classic"]],
        ["Midnight bonfire", "A late gathering for stories and warmth.", ["warm", "social", "atmosphere"], "standout"],
        ["Horror escape room", "Team puzzles under pressure.", ["scary", "creative", "social"], "legendary"],
      ]),
      ...makeItems("halloween", "food", [
        ["Caramel apples", "Sticky classic treats on a stick.", ["sweet", "classic", "comfort"]],
        ["Spiced pumpkin pie", "Warm autumn flavor in every slice.", ["warm", "spiced", "comfort"], "standout"],
        ["Black cocoa cupcakes", "Dark, theatrical and delicious.", ["sweet", "dramatic", "scary"], "standout"],
        ["Apple cider bar", "Steaming cups with spiced toppings.", ["warm", "spiced", "social"], "standout"],
      ]),
      ...makeItems("halloween", "entertainment", [
        ["Horror movie marathon", "A curated run of midnight classics.", ["scary", "classic", "social"]],
        ["Live ghost stories", "A storyteller who knows how to pause.", ["scary", "atmosphere", "creative"], "standout"],
        ["Monster dance floor", "Costumes, music and no self-consciousness.", ["social", "play", "dramatic"], "standout"],
        ["Horror games lounge", "Co-op screams in a darkened room.", ["scary", "social", "play"]],
      ]),
      ...makeItems("halloween", "atmosphere", [
        ["Low fog machine", "Mist that crawls underfoot.", ["scary", "atmosphere", "dramatic"], "standout"],
        ["Haunted soundscape", "Distant howls and unsettling whispers.", ["scary", "atmosphere", "dramatic"]],
        ["Moonlit garden", "A beautiful, quietly eerie outdoor scene.", ["atmosphere", "scenic", "elegant"], "standout"],
        ["Candlelit séance corner", "A playful parlour of mystery.", ["scary", "creative", "atmosphere"], "legendary"],
      ]),
    ],
  },
  {
    id: "onam",
    name: "Best Onam Celebration",
    kicker: "Festival of togetherness",
    description: "Compose a celebration rooted in food, art and shared tradition.",
    objective: "Build a thoughtful, joyful Onam experience with cultural care.",
    imageSearchTerm: "Onam celebration Kerala pookalam",
    accent: "#d96e24",
    componentTypes: onamTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: [
      { name: "Cultural authenticity", description: "Respectful, meaningful traditional elements.", weight: 1 },
      { name: "Food experience", description: "A satisfying, considered celebratory table.", weight: 1 },
      { name: "Festive atmosphere", description: "Warmth, color and collective joy.", weight: 1 },
      { name: "Activities", description: "Opportunities to participate and celebrate.", weight: 1 },
      { name: "Overall experience", description: "The game’s playful estimate of the celebration.", weight: 1 },
    ],
    items: [
      ...makeItems("onam", "sadhya", [
        ["Banana-leaf Sadhya", "A generous multi-dish feast served the traditional way.", ["traditional", "food", "shared"], "legendary"],
        ["Avial", "Vegetables in a coconut and yogurt sauce.", ["traditional", "food", "coconut"], "standout"],
        ["Kalan", "Tangy yogurt and coconut curry with a deep flavour.", ["traditional", "food", "coconut"], "standout"],
        ["Olan", "A gentle ash gourd and coconut milk preparation.", ["traditional", "food", "gentle"]],
      ]),
      ...makeItems("onam", "dish", [
        ["Ada pradhaman", "A rich jaggery and coconut-milk payasam.", ["traditional", "sweet", "coconut"], "legendary"],
        ["Sharkara varatti", "Jaggery-coated banana chips with warm spice.", ["traditional", "sweet", "crunch"], "standout"],
        ["Pachadi", "Cooling yogurt with fruit or vegetables.", ["traditional", "food", "fresh"]],
        ["Banana chips", "A crisp, familiar Kerala snack.", ["traditional", "crunch", "shared"]],
      ]),
      ...makeItems("onam", "culture", [
        ["Pookalam", "An intricate floral carpet made as a welcome.", ["traditional", "art", "color"], "legendary"],
        ["Vallam Kali viewing", "A spirited boat-race gathering.", ["traditional", "community", "spectacle"], "standout"],
        ["Pulikali performance", "The iconic tiger-dance celebration.", ["traditional", "performance", "color"], "legendary"],
        ["Traditional attire", "Kasavu elegance worn with pride.", ["traditional", "elegant", "community"]],
      ]),
      ...makeItems("onam", "experience", [
        ["Family gathering", "The heart of the celebration around one table.", ["family", "shared", "warm"], "standout"],
        ["Pookalam competition", "A friendly floral-art challenge.", ["art", "community", "creative"], "standout"],
        ["Onam games", "Traditional games with everyone joining in.", ["community", "play", "family"]],
        ["Cultural programme", "A stage for music, stories and dance.", ["performance", "community", "traditional"], "standout"],
      ]),
      ...makeItems("onam", "music", [
        ["Chenda melam", "Percussion that announces something joyous.", ["traditional", "music", "spectacle"], "legendary"],
        ["Maveli welcome", "A playful ceremonial arrival.", ["traditional", "play", "community"], "standout"],
        ["Lamp-lighting ceremony", "A graceful shared opening moment.", ["traditional", "warm", "elegant"], "standout"],
        ["Traditional folk songs", "Voices carrying the celebration together.", ["traditional", "music", "community"]],
      ]),
    ],
  },
  {
    id: "christmas",
    name: "Best Christmas",
    kicker: "Seasonal spectacular",
    description: "Bid for the traditions that turn a day into a memory.",
    objective: "Build a generous Christmas experience with warmth and wonder.",
    imageSearchTerm: "Christmas festive dinner tree",
    accent: "#c93f4b",
    componentTypes: christmasTypes,
    numberOfItemsRequired: 8,
    scoringCriteria: experienceCriteria,
    items: [
      ...makeItems("christmas", "decor", [
        ["Grand Christmas tree", "A tall, glowing centrepiece.", ["classic", "warm", "signature"], "legendary"],
        ["Handmade ornaments", "A tree full of little stories.", ["creative", "warm", "traditional"], "standout"],
        ["Evergreen wreath", "A generous welcome at the door.", ["classic", "warm", "traditional"]],
        ["Candlelit stockings", "A fireplace scene made for photos.", ["warm", "classic", "comfort"], "standout"],
      ]),
      ...makeItems("christmas", "food", [
        ["Gingerbread house", "Edible architecture with candy details.", ["sweet", "creative", "classic"], "standout"],
        ["Christmas roast", "The abundant table centrepiece.", ["comfort", "shared", "traditional"], "legendary"],
        ["Hot chocolate station", "Custom mugs, cream and spice.", ["warm", "sweet", "social"], "standout"],
        ["Fruit cake", "A deep, traditional festive bake.", ["traditional", "sweet", "rich"]],
      ]),
      ...makeItems("christmas", "experience", [
        ["Secret Santa", "Gifts, clues and just enough mischief.", ["social", "play", "classic"], "standout"],
        ["Family dinner", "A long table with time to linger.", ["family", "shared", "warm"], "legendary"],
        ["Carol singing", "Familiar songs, shared out loud.", ["music", "community", "warm"], "standout"],
        ["Christmas movie marathon", "Sofas, blankets and a little nostalgia.", ["comfort", "social", "classic"]],
      ]),
      ...makeItems("christmas", "atmosphere", [
        ["Crackling fireplace", "The room’s warm, flickering heart.", ["warm", "comfort", "classic"], "standout"],
        ["Fairy-light canopy", "Soft light overhead all evening.", ["warm", "dramatic", "elegant"], "standout"],
        ["Fresh snowfall", "A quiet scene outside the window.", ["scenic", "magic", "classic"], "legendary"],
        ["Cinnamon candlelight", "Spice and glow in every corner.", ["warm", "spiced", "comfort"]],
      ]),
      ...makeItems("christmas", "wildcard", [
        ["Christmas market", "Stalls, lights and something to discover.", ["social", "warm", "spectacle"], "legendary"],
        ["Ice skating rink", "A playful winter centrepiece.", ["play", "family", "magic"], "standout"],
        ["Surprise Santa visit", "A little magic for the room.", ["family", "magic", "classic"], "standout"],
        ["Winter cabin getaway", "A full festive escape.", ["comfort", "scenic", "warm"], "legendary"],
      ]),
    ],
  },
];

export const challengeCatalog = challenges;

export const getChallenge = (id: string) =>
  challenges.find((challenge) => challenge.id === id);

export const getItem = (challenge: ChallengeDefinition, itemId: string) =>
  challenge.items.find((item) => item.id === itemId);
