/**
 * index.js — resume components barrel
 *
 * Import from this file to get any resume component:
 *   import { ResumePrintView, ResumeSectionRenderer, TemplateThumbnail } from "@/components/resume"
 */

// Core views
export { ResumePrintView } from "./ResumePrintView"
export { ResumeSectionRenderer } from "./ResumeSectionRenderer"

// Templates (for direct use or testing)
export { MinimalTemplate } from "./templates/MinimalTemplate"
export { ClassicTemplate } from "./templates/ClassicTemplate"
export { ModernTemplate } from "./templates/ModernTemplate"

// Section UI
export { TemplateThumbnail } from "./sections/TemplateThumbnail"
export { FIELD_RENDERERS } from "./sections/fieldRenderers"
export {
  TextInput,
  TextareaInput,
  ListInput,
  DateRangeInput,
  SkillsInput,
  EducationInput,
  ExperienceInput,
  AchievementsInput,
  ReferencesInput,
} from "./sections/FieldInputs"

// Shared utils
export { SectionContent } from "./shared/SectionContent"
export {
  formatDate,
  formatDateRange,
  renderSectionValue,
  extractPersonal,
  partitionSections,
} from "./shared/resumeHelpers"
