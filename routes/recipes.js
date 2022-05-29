var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

router.get("/random", async (req, res, next) => {
  const user_id = req.session.user_id;
  let num_of_recipes = 3;
  try {
    let random_recipes = await recipes_utils.getRandomRecipies(
      user_id,
      num_of_recipes
    );
    res.send(random_recipes);
  } catch (error) {
    next(error);
  }
});

/** TODO- getRecipesPreview: to use in 8- search recepies */
router.get("/search", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    const recipe = await recipes_utils.searchRecipes(user_id, [
      "663559",
      "642582",
      "655705",
      "642100",
    ]);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 * TODO- check if this is the function that will be called when wanting to see a full recipie
 */
router.get("/:recipeId", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    const recipe = await recipes_utils.getRecipeDetails(
      user_id,
      req.params.recipeId
    );
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
