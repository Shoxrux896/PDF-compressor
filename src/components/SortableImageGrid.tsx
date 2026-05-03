
import { memo } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { translations, type Language } from '../i18n/translations'

export interface SortableFile {
    id: string
    file: File
    preview: string
    rotation: number
}

interface SortableItemProps {
    id: string
    file: File
    preview: string
    rotation: number
    onRemove: (id: string) => void
    onRotate: (id: string) => void
    isSelected: boolean
    onSelect: (id: string) => void
    lang: Language
}

function SortableItem({ id, file, preview, rotation, onRemove, onRotate, isSelected, onSelect, lang }: SortableItemProps) {
    const t = translations[lang]
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`sortable-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(id)}
            role="listitem"
            aria-selected={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(id)
                }
            }}
        >
            <div className="img-preview">
                <img
                    src={preview}
                    alt={file.name}
                    style={{ transform: `rotate(${rotation}deg)` }}
                    decoding="async"
                    loading="lazy"
                />
            </div>

            <div className="item-actions">
                <button
                    className="action-btn rotate-btn"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRotate(id)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title={`${t.rotate} 90°`}
                    aria-label={`${t.rotate} ${file.name}`}
                >
                    ↻
                </button>
                <button
                    className="action-btn remove-btn"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove(id)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title={t.delete}
                    aria-label={`${t.delete} ${file.name}`}
                >
                    ×
                </button>
            </div>
            <span className="file-name">{file.name}</span>
            {isSelected && <div className="selection-indicator" />}
        </div>
    )
}

const MemoSortableItem = memo(SortableItem)

interface GridProps {
    items: SortableFile[]
    onReorder: (items: SortableFile[]) => void
    onRemove: (id: string) => void
    onRotate: (id: string) => void
    selectedId: string | null
    onSelect: (id: string) => void
    lang: Language
}

export function SortableImageGrid({ items, onReorder, onRemove, onRotate, selectedId, onSelect, lang }: GridProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id)
            const newIndex = items.findIndex((item) => item.id === over.id)
            onReorder(arrayMove(items, oldIndex, newIndex))
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map(i => i.id)}
                strategy={rectSortingStrategy}
            >
                <div className="image-grid" role="list" aria-label="Image list">
                    {items.map((item) => (
                        <MemoSortableItem
                            key={item.id}
                            id={item.id}
                            file={item.file}
                            preview={item.preview}
                            rotation={item.rotation}
                            onRemove={onRemove}
                            onRotate={onRotate}
                            isSelected={selectedId === item.id}
                            onSelect={onSelect}
                            lang={lang}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}

