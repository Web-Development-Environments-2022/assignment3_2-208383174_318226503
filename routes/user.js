var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const dbFunctionality_utils = require("./utils/DbFunctionality_utils");
const recipes_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
          next();
        }
      })
      .catch((err) => next(err));
  } else {
    res.sendStatus(401);
  }
});

router.get("/", (req, res) => res.send("im in user"));

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post("/favorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await dbFunctionality_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get("/favorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const favorite_recipes = await recipes_utils.getFavoriteRecipes(user_id);
    res.status(200).send(favorite_recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * Adding a new personal recipe by a user
 */
router.post("/add", async (req, res, next) => {
  console.log("adding new recipe");
  const user_id = req.session.user_id;
  try {
    await recipes_utils.addNewRecipeByUser(user_id, req);
    res.status(200).send("New Personal Recipe successfully saved");
  } catch (error) {
    next(error);
  }
});

/**
 * Getting all the personal recipes by a user
 */
// TODO- return full recipe
router.get("/myRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const personal_recipes = await recipes_utils.getPersonalRecipes(user_id);
    res.status(200).send(personal_recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/personalPreview", async (req, res, next) => {
  try {
    const recipe_id = req.query.recipe_id;
    const personal_recipes = await recipes_utils.getPersonalRecipePreview(
      recipe_id
    );
    res.status(200).send(personal_recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/personalExtended", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.query.recipe_id;
    const personal_recipes = await recipes_utils.getPersonalFull(
      user_id,
      recipe_id
    );
    res.status(200).send(personal_recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * Getting the 3 recipes that the user last viewed
 * For the Main Page
 */
router.get("/lastThreeViewed", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    let last_viewed_recipes = await recipes_utils.getNewestViewed(user_id, 3);
    res.send(last_viewed_recipes);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
