import React, { useState, useEffect } from 'react';
import {
  Main,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Button,
  Flex,
  Searchbar,
  Box,
  Checkbox,
  Badge,
} from '@strapi/design-system';
import { ArrowClockwise, Trash } from '@strapi/icons';
import { useFetchClient, Layouts } from '@strapi/strapi/admin';
import {
  notifySnapshotDeleted,
  notifyConfirmPurge,
  notifyConfirmBulkPurge,
  notifyError,
  notifyRestored,
} from '../components/CustomNotification';

interface RecycleItem {
  id: number;
  entityUid: string;
  title: string;
  recordDocumentId: string;
  deletedAt: string;
  deletedBy?: { firstname?: string; lastname?: string; email?: string };
}

const HomePage = () => {
  const [items, setItems] = useState<RecycleItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { get, post, del } = useFetchClient();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await get<{ data?: RecycleItem[] }>(
        `/recycle-bin/items?search=${encodeURIComponent(search)}`
      );
      setItems(data?.data || []);
      setSelectedIds((prev) =>
        prev.filter((id) => (data?.data || []).some((item) => item.id === id))
      );
    } catch (err: any) {
      notifyError(err?.message || 'Failed to fetch recycle bin items', {
        title: 'Error Fetching Items',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleRestore = async (id: number, title?: string) => {
    try {
      await post(`/recycle-bin/items/${id}/restore`, {});
      notifyRestored('Item restored successfully', {
        detail: title ? `Document: ${title}` : undefined,
      });
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchItems();
    } catch (err: any) {
      notifyError(
        err?.response?.data?.error?.message || err?.message || 'Failed to restore item',
        { title: 'Restore Failed' }
      );
    }
  };

  const handlePurge = (id: number, title?: string) => {
    notifyConfirmPurge({
      id,
      title: title ? `Document: ${title}` : undefined,
      onConfirm: async () => {
        try {
          await del(`/recycle-bin/items/${id}`);
          notifySnapshotDeleted('Item permanently deleted', {
            detail: title ? `Document: ${title}` : undefined,
          });
          setSelectedIds((prev) => prev.filter((item) => item !== id));
          fetchItems();
        } catch (err: any) {
          notifyError(
            err?.response?.data?.error?.message || err?.message || 'Failed to purge item',
            { title: 'Purge Failed' }
          );
        }
      },
    });
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    const count = selectedIds.length;
    try {
      await post('/recycle-bin/items/bulk-restore', { ids: selectedIds });
      notifyRestored(`${count} ${count === 1 ? 'item' : 'items'} restored successfully`, {
        detail: `Restored ${count} selected records`,
      });
      setSelectedIds([]);
      fetchItems();
    } catch (err: any) {
      notifyError(
        err?.response?.data?.error?.message || err?.message || 'Failed to bulk restore items',
        { title: 'Bulk Restore Failed' }
      );
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkPurge = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    notifyConfirmBulkPurge({
      count,
      onConfirm: async () => {
        setBulkProcessing(true);
        try {
          await post('/recycle-bin/items/bulk-purge', { ids: selectedIds });
          notifySnapshotDeleted(
            `${count} ${count === 1 ? 'item' : 'items'} permanently deleted`,
            {
              detail: `Purged ${count} selected records`,
            }
          );
          setSelectedIds([]);
          fetchItems();
        } catch (err: any) {
          notifyError(
            err?.response?.data?.error?.message || err?.message || 'Failed to bulk purge items',
            { title: 'Bulk Purge Failed' }
          );
        } finally {
          setBulkProcessing(false);
        }
      },
    });
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  return (
    <Main>
      <Layouts.Header
        title="Recycle Bin"
        subtitle="Recover deleted content items before permanent purge"
      />
      <Layouts.Content>
        <Flex direction="column" alignItems="stretch" gap={4}>
          <Searchbar
            name="search"
            placeholder="Search by title..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            clearLabel="Clear search"
          >
            Search by title
          </Searchbar>

          {selectedIds.length > 0 && (
            <Box
              padding={3}
              background="primary100"
              hasRadius
              style={{ border: '1px solid #d9d8ff' }}
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Flex gap={2}>
                  <Badge active textColor="primary700">
                    {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
                  </Badge>
                  <Button
                    size="S"
                    variant="ghost"
                    onClick={() => setSelectedIds([])}
                    disabled={bulkProcessing}
                  >
                    Clear selection
                  </Button>
                </Flex>
                <Flex gap={2}>
                  <Button
                    size="S"
                    variant="tertiary"
                    startIcon={<ArrowClockwise />}
                    onClick={handleBulkRestore}
                    loading={bulkProcessing}
                  >
                    Restore Selected ({selectedIds.length})
                  </Button>
                  <Button
                    size="S"
                    variant="danger"
                    startIcon={<Trash />}
                    onClick={handleBulkPurge}
                    loading={bulkProcessing}
                  >
                    Purge Selected ({selectedIds.length})
                  </Button>
                </Flex>
              </Flex>
            </Box>
          )}

          <Table colCount={6} rowCount={items.length}>
            <Thead>
              <Tr>
                <Th style={{ width: 48 }}>
                  <Checkbox
                    checked={allSelected ? true : indeterminate ? 'indeterminate' : false}
                    onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                    aria-label="Select all items"
                  />
                </Th>
                <Th><Typography variant="sigma">Title</Typography></Th>
                <Th><Typography variant="sigma">Content Type</Typography></Th>
                <Th><Typography variant="sigma">Deleted At</Typography></Th>
                <Th><Typography variant="sigma">Deleted By</Typography></Th>
                <Th><Typography variant="sigma">Actions</Typography></Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.length === 0 ? (
                <Tr>
                  <Td colSpan={6}>
                    <Box padding={6} textAlign="center">
                      <Typography variant="delta" textColor="neutral600">
                        {loading ? 'Loading items...' : 'No items found in the recycle bin'}
                      </Typography>
                    </Box>
                  </Td>
                </Tr>
              ) : (
                items.map((row) => (
                  <Tr key={row.id}>
                    <Td style={{ width: 48 }}>
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={() => handleToggleSelect(row.id)}
                        aria-label={`Select item ${row.title || row.recordDocumentId}`}
                      />
                    </Td>
                    <Td><Typography>{row.title || row.recordDocumentId}</Typography></Td>
                    <Td><Typography>{row.entityUid}</Typography></Td>
                    <Td><Typography>{new Date(row.deletedAt).toLocaleString()}</Typography></Td>
                    <Td><Typography>{row.deletedBy?.email || 'System / API'}</Typography></Td>
                    <Td>
                      {selectedIds.length === 0 ? (
                        <Flex gap={2}>
                          <Button
                            size="S"
                            variant="tertiary"
                            startIcon={<ArrowClockwise />}
                            onClick={() => handleRestore(row.id, row.title)}
                          >
                            Restore
                          </Button>
                          <Button
                            size="S"
                            variant="danger-light"
                            startIcon={<Trash />}
                            onClick={() => handlePurge(row.id, row.title)}
                          >
                            Purge
                          </Button>
                        </Flex>
                      ) : (
                        <Typography variant="pi" textColor="neutral400">
                          —
                        </Typography>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Flex>
      </Layouts.Content>
    </Main>
  );
};

export { HomePage };
