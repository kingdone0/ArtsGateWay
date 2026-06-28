import React, { createContext, useState } from 'react';

export const ArtworkContext = createContext();

export const ArtworkProvider = ({ children }) => {
  const [artworks, setArtworks] = useState({}); 

  const updateLikeStatus = (artworkId, isLiked) => {
    setArtworks(prev => {
      const currentLikes = prev[artworkId]?.likes || 0;
      const newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

      return {
        ...prev,
        [artworkId]: {
          ...prev[artworkId],
          isLiked,
          likes: newLikes
        }
      };
    });
  };
  const updateArtworkRating = (artworkId, newRating) => {
    setArtworks(prev => {
      const oldRatings = prev[artworkId]?.ratings || [];
      const updatedRatings = [...oldRatings, newRating];
      const avg = updatedRatings.reduce((a, b) => a + b, 0) / updatedRatings.length;

      return {
        ...prev,
        [artworkId]: {
          ...prev[artworkId],
          ratings: updatedRatings,
          averageRating: avg
        }
      };
    });
  };
  const addArtworkComment = (artworkId, commentText, user = 'أنت') => {
    setArtworks(prev => {
      const oldComments = prev[artworkId]?.comments || [];
      const newComment = {
        id: Date.now(),
        user,
        text: commentText,
        time: 'الآن',
      };
      return {
        ...prev,
        [artworkId]: {
          ...prev[artworkId],
          comments: [newComment, ...oldComments],
        }
      };
    });
  };
  return (
    <ArtworkContext.Provider value={{
      artworks,
      setArtworks, 
      updateLikeStatus,
      updateArtworkRating,
      addArtworkComment
    }}>
      {children}
    </ArtworkContext.Provider>
  );
};
