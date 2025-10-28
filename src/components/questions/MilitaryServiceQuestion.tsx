import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FormDataType, formatName } from '../../hooks/useFormState';
import { Button } from '../ui/Button';

// ... existing code ...

// Update where the veteran's name is displayed
<h2 className="text-4xl font-bold text-white mb-4">Military Service</h2>
<p className="text-xl text-white/80">
  Which branch of the military did {formData.veteranName ? formatName(formData.veteranName) : "the veteran"} serve in?
</p> 