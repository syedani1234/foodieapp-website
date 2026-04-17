import * as dealService from '../services/dealService.js';

export const getDealsSimple = async (req, res) => {
  try {
    const deals = await dealService.getDealsSimple();
    res.json(deals);
  } catch (error) {
    console.error('Get deals simple error:', error);
    res.status(500).json({ error: 'Failed to fetch deals', message: error.message });
  }
};

export const getFilteredDeals = async (req, res) => {
  try {
    const result = await dealService.getFilteredDeals(req.query);
    res.json({
      success: true,
      data: result.deals,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }
    });
  } catch (error) {
    console.error('Get filtered deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals', message: error.message });
  }
};

export const getDealById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid deal ID' });
    }
    const deal = await dealService.getDealById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ success: true, data: deal });
  } catch (error) {
    console.error('Get deal by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch deal', message: error.message });
  }
};

export const getDealCustomization = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid deal ID' });
    }
    const customization = await dealService.getDealCustomization(id);
    if (!customization) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ success: true, ...customization });
  } catch (error) {
    console.error('Get deal customization error:', error);
    res.status(500).json({ error: 'Failed to fetch deal customization', message: error.message });
  }
};

export const createDeal = async (req, res) => {
  try {
    const dealId = await dealService.createDeal(req.body, req.file?.buffer);
    res.status(201).json({ success: true, message: 'Deal created successfully', data: { id: dealId } });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal', message: error.message });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid deal ID' });
    }
    await dealService.updateDeal(id, req.body, req.file?.buffer);
    res.json({ success: true, message: 'Deal updated successfully' });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Failed to update deal', message: error.message });
  }
};

export const deleteDeal = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid deal ID' });
    }
    await dealService.deleteDeal(id);
    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ error: 'Failed to delete deal', message: error.message });
  }
};