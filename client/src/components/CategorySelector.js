import React from 'react';

const CategorySelector = ({ categories, selectedCategories, onCategoryToggle, isHost }) => {
  if (!isHost) {
    return (
      <div className="category-info">
        <h4>Ausgewählte Kategorien:</h4>
        <div className="selected-categories-display">
          {selectedCategories.map(catId => {
            const category = categories[catId];
            return category ? (
              <span key={catId} className="category-tag">
                {category.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="category-selector">
      <h4>Wähle Kategorien:</h4>
      <div className="category-grid">
        {Object.entries(categories).map(([id, category]) => (
          <label key={id} className="category-option">
            <input
              type="checkbox"
              checked={selectedCategories.includes(id)}
              onChange={() => onCategoryToggle(id)}
            />
            <span className="category-label">{category.name}</span>
            <span className="word-count">({category.words.length} Wörter)</span>
          </label>
        ))}
      </div>
      {selectedCategories.length === 0 && (
        <p className="warning-text">Bitte wähle mindestens eine Kategorie aus!</p>
      )}
    </div>
  );
};

export default CategorySelector; 