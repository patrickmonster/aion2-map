import React from "react";

// 아이템 타입 정의
export type ItemType =
  | "전체"
  | "무기"
  | "방어구"
  | "장신구"
  | "소모품"
  | "외형"
  | "기타"
  | "인게임재화";

interface TypeSelectorProps {
  value: ItemType;
  onChange: (type: ItemType) => void;
  className?: string;
  includeAll?: boolean;
  label?: string;
  required?: boolean;
}

const TypeSelector: React.FC<TypeSelectorProps> = ({
  value,
  onChange,
  className = "search-select",
  includeAll = true,
  label,
  required = false,
}) => {
  const types: ItemType[] = [
    ...(includeAll ? ["전체" as ItemType] : []),
    "무기",
    "방어구",
    "장신구",
    "소모품",
    "외형",
    "기타",
    "인게임재화",
  ];

  return (
    <>
      {label && <label>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ItemType)}
        className={className}
        required={required}
      >
        {types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </>
  );
};

export default TypeSelector;
