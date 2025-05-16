document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
     
    // Tab handling
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        
        // Update active button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active content
        tabContents.forEach(content => {
          if (content.id === tabId) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
    
    // Helper functions
    const showResult = (elementId, data, isError = false) => {
      const resultElement = document.getElementById(elementId);
      resultElement.textContent = JSON.stringify(data, null, 2);
      resultElement.classList.add('show');
      
      if (isError) {
        resultElement.classList.add('error');
        resultElement.classList.remove('success');
      } else {
        resultElement.classList.add('success');
        resultElement.classList.remove('error');
      }
    };
    

    
    // Dynamic field handling
    const createDynamicField = (containerId) => {
      const container = document.getElementById(containerId);
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'dynamic-field';
      
      const keyGroup = document.createElement('div');
      keyGroup.className = 'form-group';
      keyGroup.style.flex = '1';
      
      const keyLabel = document.createElement('label');
      keyLabel.textContent = 'Field Name:';
      
      const keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.className = 'dynamic-field-key';
      keyInput.placeholder = 'Field name';
      
      keyGroup.appendChild(keyLabel);
      keyGroup.appendChild(keyInput);
      
      const valueGroup = document.createElement('div');
      valueGroup.className = 'form-group';
      valueGroup.style.flex = '1';
      
      const valueLabel = document.createElement('label');
      valueLabel.textContent = 'Value:';
      
      const valueInput = document.createElement('input');
      valueInput.type = 'text';
      valueInput.className = 'dynamic-field-value';
      valueInput.placeholder = 'Field value';
      
      valueGroup.appendChild(valueLabel);
      valueGroup.appendChild(valueInput);
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-field';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => {
        container.removeChild(fieldDiv);
      });
      
      fieldDiv.appendChild(keyGroup);
      fieldDiv.appendChild(valueGroup);
      fieldDiv.appendChild(removeBtn);
      
      container.appendChild(fieldDiv);
    };
    
    // Set up add field buttons
    const setupAddFieldButtons = () => {
      const addButtons = document.querySelectorAll('.add-field-btn');
      addButtons.forEach(button => {
        const containerId = button.id.replace('AddField', 'DynamicFields');
        button.addEventListener('click', () => createDynamicField(containerId));
      });
    };
    setupAddFieldButtons();
    
    // Setup add user button for insertMany
    const addUserBtn = document.getElementById('addUserBtn');
    const insertManyContainer = document.getElementById('insertManyContainer');
    
    if (addUserBtn && insertManyContainer) {
      const addNewUser = () => {
        const userTemplate = insertManyContainer.children[0].cloneNode(true);
        // Clear input values
        userTemplate.querySelectorAll('input').forEach(input => {
          input.value = '';
        });
        
        // Set up remove button
        const removeBtn = userTemplate.querySelector('.remove-user');
        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (insertManyContainer.children.length > 1) {
            insertManyContainer.removeChild(userTemplate);
          }
        });
        
        insertManyContainer.appendChild(userTemplate);
      };
      
      // Set up first user's remove button
      const firstUserRemoveBtn = insertManyContainer.querySelector('.remove-user');
      if (firstUserRemoveBtn) {
        firstUserRemoveBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (insertManyContainer.children.length > 1) {
            e.target.closest('.user-entry').remove();
          }
        });
      }
      
      addUserBtn.addEventListener('click', addNewUser);
    }
    
    // Helper function to collect form data
    const collectFormData = (formId, fields) => {
      const data = {};
      fields.forEach(field => {
        const input = document.getElementById(`${formId}${field}`);
        if (input && input.value.trim()) {
          data[field.toLowerCase()] = field === 'Age' ? parseInt(input.value) : input.value;
        }
      });
      return data;
    };
    
    // Helper function to collect dynamic fields
    const collectDynamicFields = (containerId) => {
      const container = document.getElementById(containerId);
      const data = {};
      
      if (!container) return data;
      
      const fields = container.querySelectorAll('.dynamic-field');
      fields.forEach(field => {
        const key = field.querySelector('.dynamic-field-key').value.trim();
        let value = field.querySelector('.dynamic-field-value').value.trim();
        
        if (key) {
          // Try to parse as JSON if it looks like a number, boolean, or object
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (!isNaN(value) && value !== '') value = Number(value);
          else if ((value.startsWith('{') && value.endsWith('}')) || 
                  (value.startsWith('[') && value.endsWith(']'))) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Keep as string if parsing fails
            }
          }
          data[key] = value;
        }
      });
      
      return data;
    };
    
    // Insert One Form
    document.getElementById('insertOneForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        const baseData = collectFormData('insert', ['Name', 'Age', 'City']);
        const dynamicData = collectDynamicFields('insertOneDynamicFields');
        const data = { ...baseData, ...dynamicData };
        
        if (Object.keys(data).length === 0) {
          return showResult('insertOneResult', { error: "Please fill at least one field" }, true);
        }
        
        const response = await fetch(`${API_URL}/insertOne`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        showResult('insertOneResult', result, !response.ok);
      } catch (error) {
        showResult('insertOneResult', { error: error.message }, true);
      }
    });
    
    // Insert Many Form
    document.getElementById('insertManyForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        const userEntries = document.querySelectorAll('.user-entry');
        const users = [];
        
        userEntries.forEach(entry => {
          const name = entry.querySelector('.insert-many-name').value.trim();
          const age = entry.querySelector('.insert-many-age').value.trim();
          const city = entry.querySelector('.insert-many-city').value.trim();
          
          const user = {};
          if (name) user.name = name;
          if (age) user.age = parseInt(age);
          if (city) user.city = city;
          
          if (Object.keys(user).length > 0) {
            users.push(user);
          }
        });
        
        if (users.length === 0) {
          return showResult('insertManyResult', { error: "Please fill at least one user's data" }, true);
        }
        
        const response = await fetch(`${API_URL}/insertMany`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users })
        });
        
        const result = await response.json();
        showResult('insertManyResult', result, !response.ok);
      } catch (error) {
        showResult('insertManyResult', { error: error.message }, true);
      }
    });
    
    // Find Form
    document.getElementById('findForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Basic filter fields
        const filter = {};
        const name = document.getElementById('findName').value.trim();
        const city = document.getElementById('findCity').value.trim();
        const ageMin = document.getElementById('findAgeMin').value.trim();
        const ageMax = document.getElementById('findAgeMax').value.trim();
        
        if (name) filter.name = name;
        if (city) filter.city = city;
        
        // Handle age range
        if (ageMin || ageMax) {
          filter.age = {};
          if (ageMin) filter.age.$gte = parseInt(ageMin);
          if (ageMax) filter.age.$lte = parseInt(ageMax);
        }
        
        // Advanced options
        const limit = document.getElementById('findLimit').value.trim();
        const skip = document.getElementById('findSkip').value.trim();
        const sortField = document.getElementById('findSortField').value;
        const sortOrder = document.getElementById('findSortOrder').value;
        
        // Add dynamic fields
        const dynamicData = collectDynamicFields('findDynamicFields');
        Object.assign(filter, dynamicData);
        
        // Build URL with query parameters
        let url = new URL(`${API_URL}/find`);
        
        // Add filter to query string
        url.searchParams.append('filter', JSON.stringify(filter));
        
        // Add options to query string
        if (limit) url.searchParams.append('limit', limit);
        if (skip) url.searchParams.append('skip', skip);
        if (sortField && sortField !== 'none') {
          url.searchParams.append('sortField', sortField);
          url.searchParams.append('sortOrder', sortOrder);
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        showResult('findResult', result, !response.ok);
      } catch (error) {
        showResult('findResult', { error: error.message }, true);
      }
    });
    
    // Find One Form
    document.getElementById('findOneForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Basic filter fields
        const filter = {};
        const name = document.getElementById('findOneName').value.trim();
        const city = document.getElementById('findOneCity').value.trim();
        const age = document.getElementById('findOneAge').value.trim();
        
        if (name) filter.name = name;
        if (city) filter.city = city;
        if (age) filter.age = parseInt(age);
        
        // Add dynamic fields
        const dynamicData = collectDynamicFields('findOneDynamicFields');
        Object.assign(filter, dynamicData);
        
        if (Object.keys(filter).length === 0) {
          return showResult('findOneResult', { error: "Please specify at least one filter criteria" }, true);
        }
        
        // Build URL with query parameters
        let url = new URL(`${API_URL}/findOne`);
        url.searchParams.append('filter', JSON.stringify(filter));
        
        const response = await fetch(url);
        const result = await response.json();
        
        showResult('findOneResult', result, !response.ok);
      } catch (error) {
        showResult('findOneResult', { error: error.message }, true);
      }
    });
    
    // Update One Form
    document.getElementById('updateOneForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Filter
        const filter = {};
        const filterName = document.getElementById('updateOneFilterName').value.trim();
        const filterCity = document.getElementById('updateOneFilterCity').value.trim();
        const filterAge = document.getElementById('updateOneFilterAge').value.trim();
        
        if (filterName) filter.name = filterName;
        if (filterCity) filter.city = filterCity;
        if (filterAge) filter.age = parseInt(filterAge);
        
        // Add dynamic filter fields
        const dynamicFilterData = collectDynamicFields('updateOneFilterDynamicFields');
        Object.assign(filter, dynamicFilterData);
        
        if (Object.keys(filter).length === 0) {
          return showResult('updateOneResult', { error: "Please specify at least one filter criteria" }, true);
        }
        
        // Update
        const update = {};
        const name = document.getElementById('updateOneName').value.trim();
        const city = document.getElementById('updateOneCity').value.trim();
        const age = document.getElementById('updateOneAge').value.trim();
        
        const updateFields = {};
        if (name) updateFields.name = name;
        if (city) updateFields.city = city;
        if (age) updateFields.age = parseInt(age);
        
        // Add dynamic update fields
        const dynamicUpdateData = collectDynamicFields('updateOneDynamicFields');
        Object.assign(updateFields, dynamicUpdateData);
        
        if (Object.keys(updateFields).length === 0) {
          return showResult('updateOneResult', { error: "Please specify at least one field to update" }, true);
        }
        
        update.$set = updateFields;
        
        const response = await fetch(`${API_URL}/updateOne`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter, update })
        });
        
        const result = await response.json();
        showResult('updateOneResult', result, !response.ok);
      } catch (error) {
        showResult('updateOneResult', { error: error.message }, true);
      }
    });
    
    // Update Many Form
    document.getElementById('updateManyForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Filter
        const filter = {};
        const filterName = document.getElementById('updateManyFilterName').value.trim();
        const filterCity = document.getElementById('updateManyFilterCity').value.trim();
        const filterAge = document.getElementById('updateManyFilterAge').value.trim();
        const filterAgeMin = document.getElementById('updateManyFilterAgeMin').value.trim();
        const filterAgeMax = document.getElementById('updateManyFilterAgeMax').value.trim();
        
        if (filterName) filter.name = filterName;
        if (filterCity) filter.city = filterCity;
        if (filterAge) filter.age = parseInt(filterAge);
        
        // Handle age range
        if (filterAgeMin || filterAgeMax) {
          filter.age = filter.age || {};
          if (filterAgeMin) filter.age.$gte = parseInt(filterAgeMin);
          if (filterAgeMax) filter.age.$lte = parseInt(filterAgeMax);
        }
        
        // Add dynamic filter fields
        const dynamicFilterData = collectDynamicFields('updateManyFilterDynamicFields');
        Object.assign(filter, dynamicFilterData);
        
        // Update
        const update = {};
        const name = document.getElementById('updateManyName').value.trim();
        const city = document.getElementById('updateManyCity').value.trim();
        const age = document.getElementById('updateManyAge').value.trim();
        
        const updateFields = {};
        if (name) updateFields.name = name;
        if (city) updateFields.city = city;
        if (age) updateFields.age = parseInt(age);
        
        // Add dynamic update fields
        const dynamicUpdateData = collectDynamicFields('updateManyDynamicFields');
        Object.assign(updateFields, dynamicUpdateData);
        
        if (Object.keys(updateFields).length === 0) {
          return showResult('updateManyResult', { error: "Please specify at least one field to update" }, true);
        }
        
        update.$set = updateFields;
        
        const response = await fetch(`${API_URL}/updateMany`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter, update })
        });
        
        const result = await response.json();
        showResult('updateManyResult', result, !response.ok);
      } catch (error) {
        showResult('updateManyResult', { error: error.message }, true);
      }
    });
    
    // Replace One Form
    document.getElementById('replaceOneForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Filter
        const filter = {};
        const filterName = document.getElementById('replaceOneFilterName').value.trim();
        const filterCity = document.getElementById('replaceOneFilterCity').value.trim();
        const filterAge = document.getElementById('replaceOneFilterAge').value.trim();
        
        if (filterName) filter.name = filterName;
        if (filterCity) filter.city = filterCity;
        if (filterAge) filter.age = parseInt(filterAge);
        
        // Add dynamic filter fields
        const dynamicFilterData = collectDynamicFields('replaceOneFilterDynamicFields');
        Object.assign(filter, dynamicFilterData);
        
        if (Object.keys(filter).length === 0) {
          return showResult('replaceOneResult', { error: "Please specify at least one filter criteria" }, true);
        }
        
        // Replacement document
        const replacement = {};
        const name = document.getElementById('replaceOneName').value.trim();
        const city = document.getElementById('replaceOneCity').value.trim();
        const age = document.getElementById('replaceOneAge').value.trim();
        
        if (name) replacement.name = name;
        if (city) replacement.city = city;
        if (age) replacement.age = parseInt(age);
        
        // Add dynamic fields to replacement
        const dynamicReplacementData = collectDynamicFields('replaceOneDynamicFields');
        Object.assign(replacement, dynamicReplacementData);
        
        if (Object.keys(replacement).length === 0) {
          return showResult('replaceOneResult', { error: "Please specify at least one field for the replacement document" }, true);
        }
        
        const response = await fetch(`${API_URL}/replaceOne`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter, replacement })
        });
        
        const result = await response.json();
        showResult('replaceOneResult', result, !response.ok);
      } catch (error) {
        showResult('replaceOneResult', { error: error.message }, true);
      }
    });
    
    // Delete One Form
    document.getElementById('deleteOneForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Filter
        const filter = {};
        const name = document.getElementById('deleteOneName').value.trim();
        const city = document.getElementById('deleteOneCity').value.trim();
        const age = document.getElementById('deleteOneAge').value.trim();
        
        if (name) filter.name = name;
        if (city) filter.city = city;
        if (age) filter.age = parseInt(age);
        
        // Add dynamic filter fields
        const dynamicFilterData = collectDynamicFields('deleteOneDynamicFields');
        Object.assign(filter, dynamicFilterData);
        
        if (Object.keys(filter).length === 0) {
          return showResult('deleteOneResult', { error: "Please specify at least one filter criteria" }, true);
        }
        
        // Build URL with query parameters
        let url = new URL(`${API_URL}/deleteOne`);
        url.searchParams.append('filter', JSON.stringify(filter));
        
        const response = await fetch(url, { method: 'DELETE' });
        const result = await response.json();
        
        showResult('deleteOneResult', result, !response.ok);
      } catch (error) {
        showResult('deleteOneResult', { error: error.message }, true);
      }
    });
    
    // Delete Many Form
    document.getElementById('deleteManyForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Filter
        const filter = {};
        const name = document.getElementById('deleteManyName').value.trim();
        const city = document.getElementById('deleteManyCity').value.trim();
        const age = document.getElementById('deleteManyAge').value.trim();
        const ageMin = document.getElementById('deleteManyAgeMin').value.trim();
        const ageMax = document.getElementById('deleteManyAgeMax').value.trim();
        
        if (name) filter.name = name;
        if (city) filter.city = city;
        if (age) filter.age = parseInt(age);
        
        // Handle age range
        if (ageMin || ageMax) {
          filter.age = filter.age !== undefined ? { $eq: filter.age } : {};
          if (ageMin) filter.age.$gte = parseInt(ageMin);
          if (ageMax) filter.age.$lte = parseInt(ageMax);
        }
        
        // Add dynamic filter fields
        const dynamicFilterData = collectDynamicFields('deleteManyDynamicFields');
        Object.assign(filter, dynamicFilterData);
        
        // Build URL with query parameters
        let url = new URL(`${API_URL}/deleteMany`);
        url.searchParams.append('filter', JSON.stringify(filter));
        
        const response = await fetch(url, { method: 'DELETE' });
        const result = await response.json();
        
        showResult('deleteManyResult', result, !response.ok);
      } catch (error) {
        showResult('deleteManyResult', { error: error.message }, true);
      }
    });
    
    // Count Documents Form
    document.getElementById('countForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        // Filter
        const filter = {};
        const name = document.getElementById('countName').value.trim();
        const city = document.getElementById('countCity').value.trim();
        const age = document.getElementById('countAge').value.trim();
        const ageMin = document.getElementById('countAgeMin').value.trim();
        const ageMax = document.getElementById('countAgeMax').value.trim();
        
        if (name) filter.name = name;
        if (city) filter.city = city;
        if (age) filter.age = parseInt(age);
        
        // Handle age range
        if (ageMin || ageMax) {
          filter.age = filter.age !== undefined ? { $eq: filter.age } : {};
          if (ageMin) filter.age.$gte = parseInt(ageMin);
          if (ageMax) filter.age.$lte = parseInt(ageMax);
        }
        
        // Add dynamic filter fields
        const dynamicFilterData = collectDynamicFields('countDynamicFields');
        Object.assign(filter, dynamicFilterData);
        
        // Build URL with query parameters
        let url = new URL(`${API_URL}/count`);
        url.searchParams.append('filter', JSON.stringify(filter));
        
        const response = await fetch(url);
        const result = await response.json();
        
        showResult('countResult', result, !response.ok);
      } catch (error) {
        showResult('countResult', { error: error.message }, true);
      }
    });
    
    // Distinct Form
    document.getElementById('distinctForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      try {
        const field = document.getElementById('distinctField').value;
        
        if (!field) {
          return showResult('distinctResult', { error: "Please select a field" }, true);
        }
        
        // Build URL with query parameters
        let url = new URL(`${API_URL}/distinct`);
        url.searchParams.append('field', field);
        
        const response = await fetch(url);
        const result = await response.json();
        
        showResult('distinctResult', result, !response.ok);
      } catch (error) {
        showResult('distinctResult', { error: error.message }, true);
      }
    });

   // Find One and Update form handling
const findOneAndUpdateForm = document.getElementById('findOneAndUpdateForm');
if (findOneAndUpdateForm) {
  findOneAndUpdateForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      // Get filter criteria and update values
      const filterData = {};
      const updateData = {};
      
      // Process filter fields
      const filterName = document.getElementById('findOneAndUpdateFilterName');
      if (filterName && filterName.value.trim()) {
        filterData.name = filterName.value.trim();
      }
      
      const filterAge = document.getElementById('findOneAndUpdateFilterAge');
      if (filterAge && filterAge.value.trim()) {
        filterData.age = parseInt(filterAge.value.trim());
      }
      
      const filterCity = document.getElementById('findOneAndUpdateFilterCity');
      if (filterCity && filterCity.value.trim()) {
        filterData.city = filterCity.value.trim();
      }
      
      // Process filter dynamic fields
      const filterDynamicFields = document.getElementById('findOneAndUpdateFilterDynamicFields');
      if (filterDynamicFields) {
        const rows = filterDynamicFields.querySelectorAll('.dynamic-field-row');
        rows.forEach(row => {
          const keyInput = row.querySelector('.field-key');
          const valueInput = row.querySelector('.field-value');
          
          if (keyInput && valueInput && keyInput.value.trim()) {
            let value = valueInput.value.trim();
            
            // Try to parse values as appropriate types
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            
            filterData[keyInput.value.trim()] = value;
          }
        });
      }
      
      // Process update fields
      const updateName = document.getElementById('findOneAndUpdateName');
      if (updateName && updateName.value.trim()) {
        updateData.name = updateName.value.trim();
      }
      
      const updateAge = document.getElementById('findOneAndUpdateAge');
      if (updateAge && updateAge.value.trim()) {
        updateData.age = parseInt(updateAge.value.trim());
      }
      
      const updateCity = document.getElementById('findOneAndUpdateCity');
      if (updateCity && updateCity.value.trim()) {
        updateData.city = updateCity.value.trim();
      }
      
      // Process update dynamic fields
      const updateDynamicFields = document.getElementById('findOneAndUpdateDynamicFields');
      if (updateDynamicFields) {
        const rows = updateDynamicFields.querySelectorAll('.dynamic-field-row');
        rows.forEach(row => {
          const keyInput = row.querySelector('.field-key');
          const valueInput = row.querySelector('.field-value');
          
          if (keyInput && valueInput && keyInput.value.trim()) {
            let value = valueInput.value.trim();
            
            // Try to parse values as appropriate types
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            
            updateData[keyInput.value.trim()] = value;
          }
        });
      }
      
      // Default options
      const options = {
        returnDocument: 'after'
      };
      
      const data = {
        filter: filterData,
        update: updateData,  // Directly use updateData for replacement
        options: options
      };
      
      const result = await fetch(`${API_URL}/findOneAndUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await result.json();
      displayResult('findOneAndUpdateResult', responseData);
    } catch (error) {
      displayResult('findOneAndUpdateResult', { error: error.message });
    }
  });
}

// Helper function to display results
const displayResult = (elementId, data) => {
  const resultElement = document.getElementById(elementId);
  resultElement.textContent = JSON.stringify(data, null, 2);
  resultElement.classList.add('show');
  if (data.error) {
    resultElement.classList.add('error');
    resultElement.classList.remove('success');
  } else {
    resultElement.classList.add('success');
    resultElement.classList.remove('error');
  }
};

// Find One and Delete form handling
const findOneAndDeleteForm = document.getElementById('findOneAndDeleteForm');
if (findOneAndDeleteForm) {
  findOneAndDeleteForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      // Process filter fields
      const filterData = {};
      
      const filterName = document.getElementById('findOneAndDeleteName');
      if (filterName && filterName.value.trim()) {
        filterData.name = filterName.value.trim();
      }
      
      const filterAge = document.getElementById('findOneAndDeleteAge');
      if (filterAge && filterAge.value.trim()) {
        filterData.age = parseInt(filterAge.value.trim());
      }
      
      const filterCity = document.getElementById('findOneAndDeleteCity');
      if (filterCity && filterCity.value.trim()) {
        filterData.city = filterCity.value.trim();
      }
      
      // Process dynamic fields
      const dynamicFields = document.getElementById('findOneAndDeleteDynamicFields');
      if (dynamicFields) {
        const rows = dynamicFields.querySelectorAll('.dynamic-field-row');
        rows.forEach(row => {
          const keyInput = row.querySelector('.field-key');
          const valueInput = row.querySelector('.field-value');
          
          if (keyInput && valueInput && keyInput.value.trim()) {
            let value = valueInput.value.trim();
            
            // Try to parse values as appropriate types
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            
            filterData[keyInput.value.trim()] = value;
          }
        });
      }
      
      const result = await fetch(`${API_URL}/findOneAndDelete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filter: filterData })
      });
      
      const responseData = await result.json();
      displayResult('findOneAndDeleteResult', responseData);
    } catch (error) {
      displayResult('findOneAndDeleteResult', { error: error.message });
    }
  });
}

// Find One and Replace form handling
const findOneAndReplaceForm = document.getElementById('findOneAndReplaceForm');
if (findOneAndReplaceForm) {
  findOneAndReplaceForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
      // Get filter criteria and replacement document
      const filterData = {};
      const replacementData = {};
      
      // Process filter fields
      const filterName = document.getElementById('findOneAndReplaceFilterName');
      if (filterName && filterName.value.trim()) {
        filterData.name = filterName.value.trim();
      }
      
      const filterAge = document.getElementById('findOneAndReplaceFilterAge');
      if (filterAge && filterAge.value.trim()) {
        filterData.age = parseInt(filterAge.value.trim());
      }
      
      const filterCity = document.getElementById('findOneAndReplaceFilterCity');
      if (filterCity && filterCity.value.trim()) {
        filterData.city = filterCity.value.trim();
      }
      
      // Process filter dynamic fields
      const filterDynamicFields = document.getElementById('findOneAndReplaceFilterDynamicFields');
      if (filterDynamicFields) {
        const rows = filterDynamicFields.querySelectorAll('.dynamic-field-row');
        rows.forEach(row => {
          const keyInput = row.querySelector('.field-key');
          const valueInput = row.querySelector('.field-value');
          
          if (keyInput && valueInput && keyInput.value.trim()) {
            let value = valueInput.value.trim();
            
            // Try to parse values as appropriate types
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            
            filterData[keyInput.value.trim()] = value;
          }
        });
      }
      
      // Process replacement fields (this is the complete new document)
      const replaceName = document.getElementById('findOneAndReplaceName');
      if (replaceName && replaceName.value.trim()) {
        replacementData.name = replaceName.value.trim();
      }
      
      const replaceAge = document.getElementById('findOneAndReplaceAge');
      if (replaceAge && replaceAge.value.trim()) {
        replacementData.age = parseInt(replaceAge.value.trim());
      }
      
      const replaceCity = document.getElementById('findOneAndReplaceCity');
      if (replaceCity && replaceCity.value.trim()) {
        replacementData.city = replaceCity.value.trim();
      }
      
      // Process replacement dynamic fields
      const replaceDynamicFields = document.getElementById('findOneAndReplaceDynamicFields');
      if (replaceDynamicFields) {
        const rows = replaceDynamicFields.querySelectorAll('.dynamic-field-row');
        rows.forEach(row => {
          const keyInput = row.querySelector('.field-key');
          const valueInput = row.querySelector('.field-value');
          
          if (keyInput && valueInput && keyInput.value.trim()) {
            let value = valueInput.value.trim();
            
            // Try to parse values as appropriate types
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            
            replacementData[keyInput.value.trim()] = value;
          }
        });
      }
      
      const data = {
        filter: filterData,
        replacement: replacementData,
        options: {
          returnDocument: 'after'
        }
      };
      
      const result = await fetch(`${API_URL}/findOneAndReplace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await result.json();
      displayResult('findOneAndReplaceResult', responseData);
    } catch (error) {
      displayResult('findOneAndReplaceResult', { error: error.message });
    }
  });
}



// CREATE INDEX
document.getElementById('createIndexForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const field = document.getElementById('indexField').value.trim();
    const order = parseInt(document.getElementById('indexOrder').value);
    const isUnique = document.getElementById('uniqueIndex').checked;
    const resultBox = document.getElementById('createIndexResult');

    if (!field || isNaN(order)) {
        resultBox.innerText = "Please enter a valid field name and order.";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/createIndex`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                keys: { [field]: order },
                options: isUnique ? { unique: true } : {}
            })
        });

        const result = await response.json();
        if (response.ok) {
            resultBox.innerText = `Index created successfully: ${result.indexName}`;
            resultBox.style.color = 'green'; // Show success message in green
        } else {
            resultBox.innerText = `Error: ${result.error}`;
            resultBox.style.color = 'red'; // Show error message in red
        }
    } catch (err) {
        resultBox.innerText = `Error: ${err.message}`;
        resultBox.style.color = 'red'; // Show error message in red
    }
});

  // DROP INDEX
  document.getElementById('dropIndexForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const indexName = document.getElementById('indexNameToDrop').value.trim();
    const resultBox = document.getElementById('dropIndexResult');

    if (!indexName) {
      resultBox.innerText = "Please enter an index name.";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dropIndex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ indexName })
      });

      const result = await response.json();
      if (response.ok) {
        resultBox.innerText = `Index dropped: ${JSON.stringify(result)}`;
      } else {
        resultBox.innerText = `Error: ${result.error}`;
      }
    } catch (err) {
      resultBox.innerText = `Error: ${err.message}`;
    }
  });

  const listIndexesForm = document.getElementById('listIndexesForm');
const resultBox = document.getElementById('listIndexesResult');

if (listIndexesForm && resultBox) {
  listIndexesForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const collectionName = document.getElementById('indexCollection').value.trim();
    if (!collectionName) {
      resultBox.innerText = "Please enter a collection name.";
      return;
    }

    resultBox.innerHTML = 'Loading...';

    try {
      const response = await fetch(`${API_URL}/getIndexes?collectionName=${encodeURIComponent(collectionName)}`);
      const result = await response.json();

      if (response.ok) {
        resultBox.innerHTML = `
          <pre>${JSON.stringify(result, null, 2)}</pre>
        `;
      } else {
        resultBox.innerText = `Error: ${result.error}`;
      }
    } catch (err) {
      resultBox.innerText = `Error: ${err.message}`;
    }
  });
} else {
  console.error('listIndexesForm or listIndexesResult element is missing in the DOM.');
}

  //aggregate
  const runAggregationBtn = document.getElementById('runAggregationBtn');
if (runAggregationBtn) {
  runAggregationBtn.addEventListener('click', async () => {
    const pipelineInput = document.getElementById('pipeline').value.trim();
    const resultBox = document.getElementById('aggregation-result');

    // Hide all other result boxes
    document.querySelectorAll('.result-box').forEach(box => {
      if (box !== resultBox) {
        box.classList.remove('show');
        box.innerHTML = ''; // Clear content
      }
    });

    if (!pipelineInput) {
      resultBox.innerText = "Please enter a valid aggregation pipeline.";
      resultBox.classList.add('show');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/aggregate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pipeline: JSON.parse(pipelineInput) })
      });

      const result = await response.json();
      if (response.ok) {
        resultBox.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
      } else {
        resultBox.innerText = `Error: ${result.error}`;
      }
      resultBox.classList.add('show');
    } catch (err) {
      resultBox.innerText = `Error: ${err.message}`;
      resultBox.classList.add('show');
    }
  });
}


  // List Collections
 document.getElementById('listCollectionsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultDiv = document.getElementById('listCollectionsResult');
    resultDiv.innerHTML = 'Loading...';

    try {
      const res = await fetch(`${API_URL}/listCollections`);
      const data = await res.json();

      if (res.ok) {
        if (data.length === 0) {
          resultDiv.innerHTML = 'No collections found.';
        } else {
          resultDiv.innerHTML = '<ul>' + data.map(c => `<li>${c.name}</li>`).join('') + '</ul>';
        }
      } else {
        resultDiv.innerHTML = `Error: ${data.error}`;
      }
    } catch (err) {
      resultDiv.innerHTML = `Fetch Error: ${err.message}`;
    }
  });
  // Drop Collection
  document.getElementById('dropCollectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const collectionName = document.getElementById('collectionNameToDrop').value.trim();
    const resultDiv = document.getElementById('dropCollectionResult');
    resultDiv.innerHTML = 'Processing...';

    if (!collectionName) {
      resultDiv.innerHTML = 'Please enter a collection name to drop.';
      return;
    }

    try {
      const res = await fetch(`${API_URL}/drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName })
      });
      const data = await res.json();

      if (res.ok) {
        resultDiv.innerHTML = `Collection "${collectionName}" dropped successfully.`;
      } else {
        resultDiv.innerHTML = `Error: ${data.error}`;
      }
    } catch (err) {
      resultDiv.innerHTML = `Fetch Error: ${err.message}`;
    }
  });

  // Rename Collection
document.getElementById('renameCollectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldName = document.getElementById('oldCollectionName').value.trim();
    const newName = document.getElementById('newCollectionName').value.trim();
    const resultDiv = document.getElementById('renameCollectionResult');
    resultDiv.innerHTML = 'Renaming...';

    if (!oldName || !newName) {
        resultDiv.innerHTML = 'Please provide both old and new collection names.';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/renameCollection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName })
        });
        const data = await res.json();

        if (res.ok) {
            resultDiv.innerHTML = `Collection renamed successfully: ${data.message}`;
        } else {
            resultDiv.innerHTML = `Error: ${data.error}`;
        }
    } catch (err) {
        resultDiv.innerHTML = `Fetch Error: ${err.message}`;
    }
});

//bulkWriteForm
document.getElementById('bulkWriteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const textarea = document.getElementById('bulkOperations');
    let operations;
  
    try {
      operations = JSON.parse(textarea.value.trim());
    } catch (err) {
      document.getElementById('bulkWriteResult').innerHTML = `<p style="color:red;">Invalid JSON format</p>`;
      return;
    }
  
    try {
      const res = await fetch('/bulkWrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operations })
      });
  
      const result = await res.json();
  
      if (res.ok) {
        document.getElementById('bulkWriteResult').innerHTML = `
          <pre>${JSON.stringify(result, null, 2)}</pre>
        `;
      } else {
        document.getElementById('bulkWriteResult').innerHTML = `<p style="color:red;">${result.error}</p>`;
      }
    } catch (err) {
      document.getElementById('bulkWriteResult').innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
  });
  

      // Initialize dynamic fields and advanced toggles
      setupAdvancedToggles();
  });
  
 