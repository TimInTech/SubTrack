"""Database utilities and helpers for MongoDB operations."""

from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from .errors import DatabaseError, NotFoundError
import logging

logger = logging.getLogger(__name__)


async def safe_find_one(
    collection: AsyncIOMotorCollection,
    filter_dict: Dict[str, Any],
    resource_name: str = "Resource"
) -> Optional[Dict[str, Any]]:
    """
    Safely find one document in collection.
    
    Args:
        collection: MongoDB collection
        filter_dict: Filter criteria
        resource_name: Name of resource for error messages
        
    Returns:
        Document if found, None otherwise
        
    Raises:
        DatabaseError: If database operation fails
    """
    try:
        return await collection.find_one(filter_dict)
    except Exception as e:
        logger.error(f"Database error in find_one: {str(e)}")
        raise DatabaseError(
            message=f"Fehler beim Abrufen von {resource_name}",
            details={"filter": str(filter_dict), "error": str(e)}
        )


async def safe_find_one_or_404(
    collection: AsyncIOMotorCollection,
    filter_dict: Dict[str, Any],
    resource_name: str = "Resource",
    resource_id: str = ""
) -> Dict[str, Any]:
    """
    Find one document or raise 404 error.
    
    Args:
        collection: MongoDB collection
        filter_dict: Filter criteria
        resource_name: Name of resource for error messages
        resource_id: ID of resource for error details
        
    Returns:
        Document if found
        
    Raises:
        NotFoundError: If document not found
        DatabaseError: If database operation fails
    """
    document = await safe_find_one(collection, filter_dict, resource_name)
    if not document:
        raise NotFoundError(resource=resource_name, resource_id=resource_id)
    return document


async def safe_insert_one(
    collection: AsyncIOMotorCollection,
    document: Dict[str, Any],
    resource_name: str = "Resource"
) -> str:
    """
    Safely insert one document.
    
    Args:
        collection: MongoDB collection
        document: Document to insert
        resource_name: Name of resource for error messages
        
    Returns:
        Inserted document ID as string
        
    Raises:
        DatabaseError: If database operation fails
    """
    try:
        # Add created_at timestamp if not present
        if "created_at" not in document:
            document["created_at"] = datetime.utcnow()
            
        result = await collection.insert_one(document)
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Database error in insert_one: {str(e)}")
        raise DatabaseError(
            message=f"Fehler beim Erstellen von {resource_name}",
            details={"error": str(e)}
        )


async def safe_update_one(
    collection: AsyncIOMotorCollection,
    filter_dict: Dict[str, Any],
    update_data: Dict[str, Any],
    resource_name: str = "Resource",
    resource_id: str = ""
) -> bool:
    """
    Safely update one document.
    
    Args:
        collection: MongoDB collection
        filter_dict: Filter criteria
        update_data: Data to update
        resource_name: Name of resource for error messages
        resource_id: ID of resource for error details
        
    Returns:
        True if updated successfully
        
    Raises:
        NotFoundError: If document not found
        DatabaseError: If database operation fails
    """
    try:
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        result = await collection.update_one(
            filter_dict,
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise NotFoundError(resource=resource_name, resource_id=resource_id)
            
        return True
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Database error in update_one: {str(e)}")
        raise DatabaseError(
            message=f"Fehler beim Aktualisieren von {resource_name}",
            details={"error": str(e)}
        )


async def safe_delete_one(
    collection: AsyncIOMotorCollection,
    filter_dict: Dict[str, Any],
    resource_name: str = "Resource",
    resource_id: str = ""
) -> bool:
    """
    Safely delete one document.
    
    Args:
        collection: MongoDB collection
        filter_dict: Filter criteria
        resource_name: Name of resource for error messages
        resource_id: ID of resource for error details
        
    Returns:
        True if deleted successfully
        
    Raises:
        NotFoundError: If document not found
        DatabaseError: If database operation fails
    """
    try:
        result = await collection.delete_one(filter_dict)
        
        if result.deleted_count == 0:
            raise NotFoundError(resource=resource_name, resource_id=resource_id)
            
        return True
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Database error in delete_one: {str(e)}")
        raise DatabaseError(
            message=f"Fehler beim Löschen von {resource_name}",
            details={"error": str(e)}
        )


async def safe_find(
    collection: AsyncIOMotorCollection,
    filter_dict: Optional[Dict[str, Any]] = None,
    sort_field: Optional[str] = None,
    sort_order: int = 1,
    limit: int = 1000,
    resource_name: str = "Resource"
) -> List[Dict[str, Any]]:
    """
    Safely find multiple documents.
    
    Args:
        collection: MongoDB collection
        filter_dict: Filter criteria (None for all documents)
        sort_field: Field to sort by
        sort_order: Sort order (1 for ascending, -1 for descending)
        limit: Maximum number of documents to return
        resource_name: Name of resource for error messages
        
    Returns:
        List of documents
        
    Raises:
        DatabaseError: If database operation fails
    """
    try:
        filter_dict = filter_dict or {}
        query = collection.find(filter_dict)
        
        if sort_field:
            query = query.sort(sort_field, sort_order)
            
        return await query.limit(limit).to_list(limit)
    except Exception as e:
        logger.error(f"Database error in find: {str(e)}")
        raise DatabaseError(
            message=f"Fehler beim Abrufen von {resource_name}",
            details={"error": str(e)}
        )
