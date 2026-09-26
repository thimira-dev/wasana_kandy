"use client";

import React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { CustomizationGroupInput } from "@/lib/domain/validation";

interface CustomizationGroupEditorProps {
  groups: CustomizationGroupInput[];
  onChange: (groups: CustomizationGroupInput[]) => void;
  errors?: Record<string, string>;
}

export function CustomizationGroupEditor({
  groups,
  onChange,
  errors,
}: CustomizationGroupEditorProps) {
  const handleAddGroup = () => {
    const newGroup: CustomizationGroupInput = {
      name: "",
      fieldType: "SINGLE_SELECT",
      isRequired: false,
      sortOrder: groups.length,
      isActive: true,
      helperText: "",
      maxCharacters: null,
      options: [
        { label: "Option 1", priceAdjustment: 0, sortOrder: 0, isActive: true },
      ],
    };
    onChange([...groups, newGroup]);
  };

  const handleRemoveGroup = (groupIndex: number) => {
    const updated = groups.filter((_, i) => i !== groupIndex);
    onChange(updated);
  };

  const handleGroupFieldChange = (
    groupIndex: number,
    field: keyof CustomizationGroupInput,
    value: unknown
  ) => {
    const updated = [...groups];
    updated[groupIndex] = {
      ...updated[groupIndex],
      [field]: value,
    };
    onChange(updated);
  };

  const handleMoveGroup = (groupIndex: number, direction: "up" | "down") => {
    if (
      (direction === "up" && groupIndex === 0) ||
      (direction === "down" && groupIndex === groups.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? groupIndex - 1 : groupIndex + 1;
    const updated = [...groups];
    const temp = updated[groupIndex];
    updated[groupIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  // Option handlers
  const handleAddOption = (groupIndex: number) => {
    const updated = [...groups];
    const group = updated[groupIndex];
    group.options = [
      ...group.options,
      {
        label: "",
        priceAdjustment: 0,
        sortOrder: group.options.length,
        isActive: true,
      },
    ];
    onChange(updated);
  };

  const handleRemoveOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...groups];
    updated[groupIndex].options = updated[groupIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    onChange(updated);
  };

  const handleOptionFieldChange = (
    groupIndex: number,
    optionIndex: number,
    field: "label" | "priceAdjustment" | "isActive",
    value: unknown
  ) => {
    const updated = [...groups];
    const options = [...updated[groupIndex].options];
    options[optionIndex] = {
      ...options[optionIndex],
      [field]: value,
    };
    updated[groupIndex].options = options;
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Cake Customization Options
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure choices customers can pick (e.g. Frosting Colour, Cake Weight, Custom Message).
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddGroup}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customization Group</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="p-8 text-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl">
          <p className="text-sm font-medium text-stone-600">
            No customization options added yet.
          </p>
          <p className="text-xs text-stone-400 mt-1 mb-4">
            Click &apos;Add Customization Group&apos; if this cake has selectable options like Weight, Colour, or Message.
          </p>
          <button
            type="button"
            onClick={handleAddGroup}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-800 text-white hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Group</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group, gIdx) => {
            const groupErrorKey = `customizationGroups.${gIdx}`;
            const groupError = errors?.[groupErrorKey];
            const isSelectType =
              group.fieldType === "SINGLE_SELECT" || group.fieldType === "MULTI_SELECT";

            return (
              <div
                key={gIdx}
                className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Group Header */}
                <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                      {gIdx + 1}
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {group.name || `Option Group #${gIdx + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={gIdx === 0}
                      onClick={() => handleMoveGroup(gIdx, "up")}
                      className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:hover:text-stone-500"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={gIdx === groups.length - 1}
                      onClick={() => handleMoveGroup(gIdx, "down")}
                      className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:hover:text-stone-500"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(gIdx)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors ml-2"
                      title="Delete this group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Group Settings */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* Option Group Name */}
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Group Name <span className="text-amber-700">*</span>
                      </label>
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) =>
                          handleGroupFieldChange(gIdx, "name", e.target.value)
                        }
                        placeholder="e.g. Cake Weight, Colour, Message on Cake..."
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Field Type */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Choice Type
                      </label>
                      <select
                        value={group.fieldType}
                        onChange={(e) =>
                          handleGroupFieldChange(gIdx, "fieldType", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      >
                        <option value="SINGLE_SELECT">Select One Choice</option>
                        <option value="TEXT">Short Text (e.g. Message)</option>
                        <option value="TEXTAREA">Long Text (e.g. Note)</option>
                      </select>
                    </div>

                    {/* Required Checkbox */}
                    <div className="sm:col-span-3 flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-800">
                        <input
                          type="checkbox"
                          checked={group.isRequired}
                          onChange={(e) =>
                            handleGroupFieldChange(gIdx, "isRequired", e.target.checked)
                          }
                          className="w-4 h-4 text-amber-600 rounded-sm border-stone-300 focus:ring-amber-500"
                        />
                        <span>Customer must choose this</span>
                      </label>
                    </div>
                  </div>

                  {/* Helper Text & Max Chars */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Guidance text for customer (optional)
                      </label>
                      <input
                        type="text"
                        value={group.helperText || ""}
                        onChange={(e) =>
                          handleGroupFieldChange(gIdx, "helperText", e.target.value)
                        }
                        placeholder="e.g. Select the size for your celebration"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    {!isSelectType && (
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-medium text-stone-600 mb-1">
                          Max letters allowed (optional)
                        </label>
                        <input
                          type="number"
                          value={group.maxCharacters ?? ""}
                          onChange={(e) =>
                            handleGroupFieldChange(
                              gIdx,
                              "maxCharacters",
                              e.target.value ? parseInt(e.target.value, 10) : null
                            )
                          }
                          placeholder="e.g. 35"
                          min="1"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>

                  {/* Select Options Table (for SINGLE_SELECT) */}
                  {isSelectType && (
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                          Selectable Choices & Additional Prices
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(gIdx)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Choice</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {group.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg border border-stone-200"
                          >
                            <div className="flex-1">
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) =>
                                  handleOptionFieldChange(gIdx, oIdx, "label", e.target.value)
                                }
                                placeholder="Choice Label (e.g. 1.5 kg or Pink)..."
                                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                              />
                            </div>

                            <div className="w-36 flex items-center gap-1.5">
                              <span className="text-xs text-stone-500 font-medium">+ LKR</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={opt.priceAdjustment}
                                onChange={(e) =>
                                  handleOptionFieldChange(
                                    gIdx,
                                    oIdx,
                                    "priceAdjustment",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full px-2 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                              />
                            </div>

                            <label className="flex items-center gap-1 text-[11px] text-stone-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={opt.isActive}
                                onChange={(e) =>
                                  handleOptionFieldChange(
                                    gIdx,
                                    oIdx,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                                className="w-3.5 h-3.5 text-amber-600 rounded-sm border-stone-300 focus:ring-amber-500"
                              />
                              <span>Active</span>
                            </label>

                            <button
                              type="button"
                              disabled={group.options.length <= 1}
                              onClick={() => handleRemoveOption(gIdx, oIdx)}
                              className="p-1 text-stone-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                              title="Delete choice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {groupError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {groupError}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
