const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { authenticateToken, setUser, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', setUser, recipeController.getAllRecipes);
router.get('/my-recipes', authenticateToken, authorizeRole(['user', 'admin']), recipeController.getMyRecipes);
router.get('/recipes/new', authenticateToken, authorizeRole(['user', 'admin']), recipeController.getRecipeForm);
router.post('/recipes', authenticateToken, authorizeRole(['user', 'admin']), recipeController.createRecipe);
router.get('/recipes/:id/edit', authenticateToken, authorizeRole(['user', 'admin']), recipeController.getEditForm);
router.post('/recipes/:id/update', authenticateToken, authorizeRole(['user', 'admin']), recipeController.updateRecipe);
router.get('/recipes/:id', setUser, recipeController.getRecipeDetails);
router.post('/recipes/:id/comments', authenticateToken, authorizeRole(['user', 'admin']), recipeController.addComment);
router.post('/recipes/:id/delete', authenticateToken, authorizeRole(['user', 'admin']), recipeController.deleteRecipe);

module.exports = router;
