const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// Get all history entries
const getHistory = async (req, res) => {
  try {
    const { type } = req.query;

    // Fix: Convert pagination params to integers
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query;
    let params;

    if (type) {
      query =
        "SELECT * FROM request_history WHERE request_type = ? ORDER BY timestamp DESC";
      params = [type];
    } else {
      query = "SELECT * FROM request_history ORDER BY timestamp DESC";
      params = [];
    }

    // Don't use parameters for LIMIT and OFFSET to avoid type issues
    // Only add pagination if requested
    if (req.query.page || req.query.limit) {
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch history",
    });
  }
};

// Add history entry
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
      responseStatus || 0,
      responseBody || "",
      JSON.stringify(responseHeaders || {}),
      responseTime || 0,
      requestType,
    ];

    await pool.execute(query, params);

    res.status(201).json({
      success: true,
      data: { id },
      message: "History entry added successfully",
    });
  } catch (error) {
    console.error("Error adding history entry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add history entry",
    });
  }
};

// Delete history entry
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM request_history WHERE id = ?";
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "History entry not found",
      });
    }

    res.json({
      success: true,
      message: "History entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting history entry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete history entry",
    });
  }
};

// Toggle star status
const toggleStar = async (req, res) => {
  try {
    const { id } = req.params;

    // First get current star status
    const [rows] = await pool.execute(
      "SELECT is_starred FROM request_history WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "History entry not found",
      });
    }

    const newStarStatus = !rows[0].is_starred;

    // Update the star status
    await pool.execute(
      "UPDATE request_history SET is_starred = ? WHERE id = ?",
      [newStarStatus ? 1 : 0, id]
    );

    res.json({
      success: true,
      data: { is_starred: newStarStatus },
      message: "Star status updated successfully",
    });
  } catch (error) {
    console.error("Error toggling star status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle star status",
    });
  }
};

// Clear history
const clearHistory = async (req, res) => {
  try {
    const { type } = req.query;
    let query = "DELETE FROM request_history";
    let params = [];

    if (type) {
      query = "DELETE FROM request_history WHERE request_type = ?";
      params = [type];
    }

    const [result] = await pool.execute(query, params);

    res.json({
      success: true,
      message: `Cleared ${result.affectedRows} history entries`,
    });
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear history",
    });
  }
};

module.exports = {
  getHistory,
  addHistory,
  deleteHistory,
  toggleStar,
  clearHistory,
};
