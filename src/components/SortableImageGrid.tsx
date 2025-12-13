
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

export interface SortableFile {
    id: string
    file: File
    rotation: number
}

interface SortableItemProps {
    id: string
    file: File
    rotation: number
    onRemove: (id: string) => void
    onRotate: (id: string) => void
}

function SortableItem({ id, file, rotation, onRemove, onRotate }: SortableItemProps) {
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
            className="sortable-item"
        >
            <div className="img-preview">
                <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ transform: `rotate(${rotation}deg)` }}
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
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
                    title="Rotate 90°"
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
                    title="Remove"
                >
                    ×
                </button>
            </div>
            <span className="file-name">{file.name}</span>
        </div>
    )
}

interface GridProps {
    items: SortableFile[]
    onReorder: (items: SortableFile[]) => void
    onRemove: (id: string) => void
    onRotate: (id: string) => void
}

export function SortableImageGrid({ items, onReorder, onRemove, onRotate }: GridProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
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
                <div className="image-grid">
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            file={item.file}
                            rotation={item.rotation}
                            onRemove={onRemove}
                            onRotate={onRotate}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}

