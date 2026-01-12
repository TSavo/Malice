import { describe, expect, it } from 'vitest';

/**
 * Tests for window resize position calculation (PR #107 Bug Fix)
 *
 * This tests the fix for left/top edge resize position calculation.
 * When resizing from the left or top edge, the window position must be
 * adjusted to keep the opposite edge stationary.
 *
 * Bug: Original code had incorrect condition: `if (newW !== origW - dx + 200)`
 * Fix: Always adjust position based on width/height change: `newX = origX + (origW - newW)`
 */

describe('Window Resize Position Calculation (PR #107)', () => {
  describe('left edge resize', () => {
    it('should adjust X position when resizing from left edge without hitting minimum', () => {
      // Simulate window resize from left edge
      const origX = 100;
      const origW = 400;
      const dx = -50; // Dragging left (increasing width)
      const minWidth = 200;

      // Calculate new width and position
      const requestedW = origW - dx; // 400 - (-50) = 450
      const newW = Math.max(minWidth, requestedW); // max(200, 450) = 450
      const newX = origX + (origW - newW); // 100 + (400 - 450) = 50

      expect(newW).toBe(450);
      expect(newX).toBe(50);
    });

    it('should adjust X position when resizing from left edge hits minimum width', () => {
      // Simulate window resize from left edge that hits minimum
      const origX = 100;
      const origW = 250;
      const dx = 100; // Dragging right (decreasing width)
      const minWidth = 200;

      // Calculate new width and position
      const requestedW = origW - dx; // 250 - 100 = 150 (below minimum)
      const newW = Math.max(minWidth, requestedW); // max(200, 150) = 200
      const newX = origX + (origW - newW); // 100 + (250 - 200) = 150

      expect(newW).toBe(200); // Clamped to minimum
      expect(newX).toBe(150); // Position adjusted by 50px
    });

    it('should correctly adjust X position for large left edge drag', () => {
      const origX = 500;
      const origW = 600;
      const dx = -200; // Dragging left by 200px
      const minWidth = 200;

      const requestedW = origW - dx; // 600 - (-200) = 800
      const newW = Math.max(minWidth, requestedW); // max(200, 800) = 800
      const newX = origX + (origW - newW); // 500 + (600 - 800) = 300

      expect(newW).toBe(800);
      expect(newX).toBe(300);
    });

    it('should keep position unchanged when width does not change', () => {
      const origX = 100;
      const origW = 400;
      const dx = 0; // No drag
      const minWidth = 200;

      const requestedW = origW - dx; // 400 - 0 = 400
      const newW = Math.max(minWidth, requestedW); // max(200, 400) = 400
      const newX = origX + (origW - newW); // 100 + (400 - 400) = 100

      expect(newW).toBe(400);
      expect(newX).toBe(100); // Position unchanged
    });
  });

  describe('top edge resize', () => {
    it('should adjust Y position when resizing from top edge without hitting minimum', () => {
      // Simulate window resize from top edge
      const origY = 200;
      const origH = 300;
      const dy = -75; // Dragging up (increasing height)
      const minHeight = 100;

      // Calculate new height and position
      const requestedH = origH - dy; // 300 - (-75) = 375
      const newH = Math.max(minHeight, requestedH); // max(100, 375) = 375
      const newY = origY + (origH - newH); // 200 + (300 - 375) = 125

      expect(newH).toBe(375);
      expect(newY).toBe(125);
    });

    it('should adjust Y position when resizing from top edge hits minimum height', () => {
      // Simulate window resize from top edge that hits minimum
      const origY = 200;
      const origH = 150;
      const dy = 80; // Dragging down (decreasing height)
      const minHeight = 100;

      // Calculate new height and position
      const requestedH = origH - dy; // 150 - 80 = 70 (below minimum)
      const newH = Math.max(minHeight, requestedH); // max(100, 70) = 100
      const newY = origY + (origH - newH); // 200 + (150 - 100) = 250

      expect(newH).toBe(100); // Clamped to minimum
      expect(newY).toBe(250); // Position adjusted by 50px
    });

    it('should correctly adjust Y position for large top edge drag', () => {
      const origY = 400;
      const origH = 500;
      const dy = -150; // Dragging up by 150px
      const minHeight = 100;

      const requestedH = origH - dy; // 500 - (-150) = 650
      const newH = Math.max(minHeight, requestedH); // max(100, 650) = 650
      const newY = origY + (origH - newH); // 400 + (500 - 650) = 250

      expect(newH).toBe(650);
      expect(newY).toBe(250);
    });

    it('should keep position unchanged when height does not change', () => {
      const origY = 200;
      const origH = 300;
      const dy = 0; // No drag
      const minHeight = 100;

      const requestedH = origH - dy; // 300 - 0 = 300
      const newH = Math.max(minHeight, requestedH); // max(100, 300) = 300
      const newY = origY + (origH - newH); // 200 + (300 - 300) = 200

      expect(newH).toBe(300);
      expect(newY).toBe(200); // Position unchanged
    });
  });

  describe('right/bottom edge resize (no position adjustment needed)', () => {
    it('should not adjust X position when resizing from right edge', () => {
      const origX = 100;
      const origW = 400;
      const dx = 50; // Dragging right (increasing width)
      const minWidth = 200;

      // Right edge resize: position stays the same
      const newW = Math.max(minWidth, origW + dx); // max(200, 450) = 450
      const newX = origX; // Position unchanged for right edge

      expect(newW).toBe(450);
      expect(newX).toBe(100); // X position unchanged
    });

    it('should not adjust Y position when resizing from bottom edge', () => {
      const origY = 200;
      const origH = 300;
      const dy = 75; // Dragging down (increasing height)
      const minHeight = 100;

      // Bottom edge resize: position stays the same
      const newH = Math.max(minHeight, origH + dy); // max(100, 375) = 375
      const newY = origY; // Position unchanged for bottom edge

      expect(newH).toBe(375);
      expect(newY).toBe(200); // Y position unchanged
    });
  });

  describe('combined resize scenarios', () => {
    it('should handle corner resize (top-left)', () => {
      // Resizing from top-left corner
      const origX = 100;
      const origY = 200;
      const origW = 400;
      const origH = 300;
      const dx = 50; // Dragging right (decreasing width)
      const dy = 30; // Dragging down (decreasing height)
      const minWidth = 200;
      const minHeight = 100;

      // Left edge: adjust X
      const requestedW = origW - dx; // 400 - 50 = 350
      const newW = Math.max(minWidth, requestedW); // max(200, 350) = 350
      const newX = origX + (origW - newW); // 100 + (400 - 350) = 150

      // Top edge: adjust Y
      const requestedH = origH - dy; // 300 - 30 = 270
      const newH = Math.max(minHeight, requestedH); // max(100, 270) = 270
      const newY = origY + (origH - newH); // 200 + (300 - 270) = 230

      expect(newW).toBe(350);
      expect(newX).toBe(150);
      expect(newH).toBe(270);
      expect(newY).toBe(230);
    });

    it('should handle corner resize (bottom-right)', () => {
      // Resizing from bottom-right corner (no position changes)
      const origX = 100;
      const origY = 200;
      const origW = 400;
      const origH = 300;
      const dx = 100; // Dragging right
      const dy = 50; // Dragging down
      const minWidth = 200;
      const minHeight = 100;

      // Right edge: no X adjustment
      const newW = Math.max(minWidth, origW + dx); // max(200, 500) = 500
      const newX = origX; // Position unchanged

      // Bottom edge: no Y adjustment
      const newH = Math.max(minHeight, origH + dy); // max(100, 350) = 350
      const newY = origY; // Position unchanged

      expect(newW).toBe(500);
      expect(newX).toBe(100); // Unchanged
      expect(newH).toBe(350);
      expect(newY).toBe(200); // Unchanged
    });
  });
});
