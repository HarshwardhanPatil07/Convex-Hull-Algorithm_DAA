# Convex Hull Algorithm Visualization

This project demonstrates various convex hull generation algorithms with interactive visualizations.

## Algorithms Implemented

1. **Jarvis March (Gift Wrapping)**
   - Runtime: O(nh) where n is the total number of points and h is the number of hull points
   - Finds the leftmost point and wraps around the point set

2. **Divide & Conquer**
   - Runtime: O(nh log(nh)) where n is the total number of points, h is the number of hull points, and p is the number of recursive partitions
   - Divides points into subsets, finds hulls for each, then merges them

3. **Monotone Chain**
   - Runtime: O(n log n) where n is the total number of points
   - Builds upper and lower hulls separately, then combines them

4. **Graham Scan**
   - Runtime: O(n log n) where n is the total number of points
   - Sorts points by angle from the lowest point, then builds the hull

## How to Use

1. Open `index.html` in a web browser
2. Use the control panel to:
   - Adjust the number of points
   - Select the algorithm to visualize
   - Choose algorithm-specific options
   - Reset the visualization

## Features

- Interactive visualization of convex hull algorithms
- Adjustable number of points
- Multiple algorithm options
- Step-by-step visualization of the algorithm execution
- Color-coded hulls for better understanding

## Technologies Used

- HTML5
- CSS3
- JavaScript
- p5.js for visualization
- Bootstrap for UI components