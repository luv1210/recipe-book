const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { authenticateToken, setUser, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', setUser, recipeController.getAllRecipes);
router.get('/my-recipes', authenticateToken, recipeController.getMyRecipes);
router.get('/recipes/new', authenticateToken, recipeController.getRecipeForm);
router.post('/recipes', authenticateToken, recipeController.upload.single('image'), recipeController.createRecipe);
router.get('/recipes/:id', setUser, recipeController.getRecipeDetails);
router.post('/recipes/:id/comments', authenticateToken, recipeController.addComment);
router.post('/recipes/:id/delete', authenticateToken, recipeController.deleteRecipe);

module.exports = router;
