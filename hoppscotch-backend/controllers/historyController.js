const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// Get all history entries
const getHistory = async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;

    let query = "SELECT * FROM request_history";
    let params = [];

    if (type) {
      query += " WHERE request_type = ?";
      params.push(type);
    }

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// Add new history entry
const addHistory = async (req, res) => {
  try {
    const {
      method,
      url,
      headers,
      body,
      responseStatus,
      responseBody,
      responseHeaders,
      responseTime,
      requestType = "REST",
    } = req.body;

    const id = uuidv4();

    const query = `
      INSERT INTO request_history 
      (id, method, url, headers, body, response_status, response_body, response_headers, response_time, request_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      method,
      url,
      JSON.stringify(headers || {}),
      body || null,
      responseStatus,
      responseBody,
      JSON.stringify(responseHeaders || {}),
      responseTime,
      requestType,
    ];

    await pool.execute(query, params);

    // Return the created entry
    const [newEntry] = await pool.execute(
      "SELECT * FROM request_history WHERE id = ?",
      [id]
    );
    res.status(201).json(newEntry[0]);
  } catch (error) {
    console.error("Error adding history:", error);
    res.status(500).json({ error: "Failed to add history entry" });
  }
};

// Delete history entry
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      "DELETE FROM request_history WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "History entry not found" });
    }

    res.json({ message: "History entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting history:", error);
    res.status(500).json({ error: "Failed to delete history entry" });
  }
};

// Star/unstar history entry
const toggleStar = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current star status
    const [current] = await pool.execute(
      "SELECT is_starred FROM request_history WHERE id = ?",
      [id]
    );

    if (current.length === 0) {
      return res.status(404).json({ error: "History entry not found" });
    }

    const newStarStatus = !current[0].is_starred;

    await pool.execute(
      "UPDATE request_history SET is_starred = ? WHERE id = ?",
      [newStarStatus, id]
    );

    res.json({ message: "Star status updated", is_starred: newStarStatus });
  } catch (error) {
    console.error("Error toggling star:", error);
    res.status(500).json({ error: "Failed to update star status" });
  }
};

// Clear all history
const clearHistory = async (req, res) => {
  try {
    const { type } = req.query;

    let query = "DELETE FROM request_history";
    let params = [];

    if (type) {
      query += " WHERE request_type = ?";
      params.push(type);
    }

    await pool.execute(query, params);
    res.json({ message: "History cleared successfully" });
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({ error: "Failed to clear history" });
  }
};

module.exports = {
  getHistory,
  addHistory,
  deleteHistory,
  toggleStar,
  clearHistory,
};
